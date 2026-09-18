using LexControlApi.Dtos.Documentos;
using LexControlApi.Excepciones;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

/// <summary>Endpoints de upload y gestion de archivos de expedientes.</summary>
[ApiController]
[Route("api/documentos")]
[Authorize]
public class DocumentosController : ControllerBase
{
    private readonly IFileStorageService _storage;
    private readonly IExpedienteService _expedienteService;

    public DocumentosController(IFileStorageService storage, IExpedienteService expedienteService)
    {
        _storage = storage;
        _expedienteService = expedienteService;
    }

    /// <summary>Sube un archivo y lo registra en un expediente.</summary>
    [HttpPost("upload")]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    [ProducesResponseType(typeof(ApiResponse<DocumentoUploadDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<DocumentoUploadDto>>> Subir(
        IFormFile file,
        [FromForm] int expedienteId,
        [FromForm] string? descripcion = null)
    {
        if (file is null || file.Length == 0)
            throw new ExcepcionNegocio(-1, "No se envio ningun archivo.", StatusCodes.Status400BadRequest);

        if (file.Length > 50 * 1024 * 1024)
            throw new ExcepcionNegocio(-1, "El archivo excede el limite de 50 MB.", StatusCodes.Status400BadRequest);

        var tiposPermitidos = new[] { ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!tiposPermitidos.Contains(extension))
            throw new ExcepcionNegocio(-1,
                $"Tipo de archivo no permitido: {extension}. Tipos permitidos: {string.Join(", ", tiposPermitidos)}",
                StatusCodes.Status400BadRequest);

        var resultado = await _storage.GuardarAsync(file, expedienteId, descripcion);

        var usuarioId = User.ObtenerUsuarioId();
        var docDto = await _expedienteService.CrearDocumentoAsync(expedienteId,
            new Dtos.Expedientes.DocExpedienteCrearDto
            {
                NombreArchivo = resultado.NombreArchivo,
                RutaArchivo = resultado.RutaArchivo,
                TipoArchivo = resultado.TipoArchivo,
                Tamano = resultado.Tamano,
                Descripcion = descripcion
            }, usuarioId);

        return CreatedAtAction(nameof(Subir), new DocumentoUploadDto
        {
            Id = docDto.Id,
            NombreArchivo = docDto.NombreArchivo,
            RutaArchivo = docDto.RutaArchivo,
            TipoArchivo = docDto.TipoArchivo,
            Tamano = docDto.Tamano ?? 0,
            Descripcion = docDto.Descripcion,
            FechaSubida = docDto.FechaSubida
        });
    }

    /// <summary>Descarga un documento por su ID (resuelve la ruta en el servidor).</summary>
    [HttpGet("{documentoId:int}/download")]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    public async Task<IActionResult> Descargar(int documentoId)
    {
        var doc = await _expedienteService.ObtenerDocumentoPorIdAsync(documentoId);
        if (doc is null)
            return NotFound();

        return ServirArchivo(doc.RutaArchivo, inline: false, nombre: doc.NombreArchivo);
    }

    /// <summary>Vista previa inline de un documento por su ID.</summary>
    [HttpGet("{documentoId:int}/preview")]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    public async Task<IActionResult> Preview(int documentoId)
    {
        var doc = await _expedienteService.ObtenerDocumentoPorIdAsync(documentoId);
        if (doc is null)
            return NotFound();

        return ServirArchivo(doc.RutaArchivo, inline: true);
    }

    /// <summary>Elimina un archivo del disco y su registro.</summary>
    [HttpDelete("{documentoId:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar(int documentoId)
    {
        await _expedienteService.EliminarDocumentoAsync(documentoId);
        return NoContent();
    }

    /// <summary>Sirve un archivo validando que la ruta permanezca en el directorio base.</summary>
    private IActionResult ServirArchivo(string rutaRelativa, bool inline, string? nombre = null)
    {
        var rutaAbsoluta = _storage.ResolverRutaSegura(rutaRelativa);
        if (rutaAbsoluta is null || !System.IO.File.Exists(rutaAbsoluta))
            return NotFound();

        var stream = new FileStream(rutaAbsoluta, FileMode.Open, FileAccess.Read, FileShare.Read);
        var contentType = ArchivoContentType.Obtener(rutaAbsoluta);

        if (inline)
        {
            Response.Headers.Append("Content-Disposition", "inline");
            return File(stream, contentType);
        }

        return File(stream, contentType, nombre ?? Path.GetFileName(rutaAbsoluta));
    }
}

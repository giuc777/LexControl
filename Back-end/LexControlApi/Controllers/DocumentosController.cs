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

        var tiposPermitidos = new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".txt" };
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

    /// <summary>Descarga un archivo por su ruta.</summary>
    [HttpGet("download/{ruta}")]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    public IActionResult Descargar(string ruta)
    {
        var rutaAbsoluta = _storage.ObtenerRutaAbsoluta(ruta);
        if (!System.IO.File.Exists(rutaAbsoluta))
            return NotFound();

        var stream = new FileStream(rutaAbsoluta, FileMode.Open, FileAccess.Read);
        var contentType = ObtenerContentType(ruta);
        var nombre = Path.GetFileName(rutaAbsoluta);

        return File(stream, contentType, nombre);
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

    private static string ObtenerContentType(string ruta) => Path.GetExtension(ruta).ToLowerInvariant() switch
    {
        ".pdf" => "application/pdf",
        ".doc" => "application/msword",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls" => "application/vnd.ms-excel",
        ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".txt" => "text/plain",
        _ => "application/octet-stream"
    };
}

using LexControlApi.Dtos.Documentos;
using LexControlApi.Dtos.Tramites;
using LexControlApi.Excepciones;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/tramites")]
[Authorize]
public class TramitesController : ControllerBase
{
    private readonly ITramiteService _service;
    private readonly IFileStorageService _storage;

    public TramitesController(ITramiteService service, IFileStorageService storage)
    {
        _service = service;
        _storage = storage;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<TramiteDto>>>> Listar(
        [FromQuery] int? expedienteId, [FromQuery] int? estadoId,
        [FromQuery] int? tipoId, [FromQuery] DateTime? fechaInicio,
        [FromQuery] DateTime? fechaFin)
    {
        var resultado = await _service.ListarAsync(expedienteId, estadoId, tipoId,
            fechaInicio, fechaFin);
        return Ok(ApiResponse<List<TramiteDto>>.Correcto(resultado));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<TramiteDetalleDto>>> ObtenerPorId(int id)
    {
        var resultado = await _service.ObtenerPorIdAsync(id);
        if (resultado is null)
            return NotFound(ApiResponse<TramiteDetalleDto>.Fallo("Trámite no encontrado."));
        return Ok(ApiResponse<TramiteDetalleDto>.Correcto(resultado));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(TramiteCrearDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPut("{id:int}/estado")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<IActionResult> ActualizarEstado(int id, TramiteActualizarEstadoDto dto)
    {
        await _service.ActualizarEstadoAsync(id, dto);
        return NoContent();
    }

    // ════════════════════════════════════════════════════════════
    // NOTAS INTERNAS
    // ════════════════════════════════════════════════════════════

    [HttpGet("{id:int}/notas")]
    [ProducesResponseType(typeof(ApiResponse<List<NotaTramiteDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<NotaTramiteDto>>>> ObtenerNotas(int id)
    {
        var notas = await _service.ObtenerNotasAsync(id);
        return Ok(ApiResponse<List<NotaTramiteDto>>.Correcto(notas));
    }

    [HttpPost("{id:int}/notas")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(typeof(ApiResponse<NotaTramiteDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<NotaTramiteDto>>> CrearNota(int id, NotaTramiteCrearDto datos)
    {
        var usuarioId = User.ObtenerUsuarioId();
        var nota = await _service.CrearNotaAsync(id, datos, usuarioId);
        return CreatedAtAction(nameof(ObtenerNotas), new { id },
            ApiResponse<NotaTramiteDto>.Correcto(nota));
    }

    [HttpDelete("notas/{notaId:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> EliminarNota(int notaId)
    {
        await _service.EliminarNotaAsync(notaId);
        return NoContent();
    }

    // ════════════════════════════════════════════════════════════
    // DOCUMENTOS ADJUNTOS
    // ════════════════════════════════════════════════════════════

    [HttpGet("{id:int}/documentos")]
    [ProducesResponseType(typeof(ApiResponse<List<DocTramiteDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<DocTramiteDto>>>> ObtenerDocumentos(int id)
    {
        var documentos = await _service.ObtenerDocumentosAsync(id);
        return Ok(ApiResponse<List<DocTramiteDto>>.Correcto(documentos));
    }

    [HttpPost("{id:int}/documentos/upload")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(typeof(ApiResponse<DocumentoUploadDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<DocumentoUploadDto>>> SubirDocumento(
        int id, IFormFile file, [FromForm] string? descripcion = null)
    {
        if (file is null || file.Length == 0)
            throw new ExcepcionNegocio(-1, "No se envio ningun archivo.",
                StatusCodes.Status400BadRequest);

        if (file.Length > 50 * 1024 * 1024)
            throw new ExcepcionNegocio(-1, "El archivo excede el limite de 50 MB.",
                StatusCodes.Status400BadRequest);

        var tiposPermitidos = new[] { ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".txt" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!tiposPermitidos.Contains(extension))
            throw new ExcepcionNegocio(-1,
                $"Tipo de archivo no permitido: {extension}. Tipos permitidos: {string.Join(", ", tiposPermitidos)}",
                StatusCodes.Status400BadRequest);

        var tramite = await _service.ObtenerPorIdAsync(id);
        if (tramite is null)
            return NotFound(ApiResponse<object>.Fallo("Trámite no encontrado."));

        var resultado = await _storage.GuardarEnCarpetaAsync(file, $"tramites/{id}", descripcion);

        var usuarioId = User.ObtenerUsuarioId();
        var doc = await _service.CrearDocumentoAsync(id, new DocTramiteCrearDto
        {
            NombreArchivo = resultado.NombreArchivo,
            RutaArchivo = resultado.RutaArchivo,
            TipoArchivo = resultado.TipoArchivo,
            Tamano = resultado.Tamano,
            Descripcion = descripcion
        }, usuarioId);

        return CreatedAtAction(nameof(ObtenerDocumentos), new { id },
            ApiResponse<DocumentoUploadDto>.Correcto(new DocumentoUploadDto
            {
                Id = doc.Id,
                NombreArchivo = doc.NombreArchivo,
                RutaArchivo = doc.RutaArchivo,
                TipoArchivo = doc.TipoArchivo,
                Tamano = doc.Tamano ?? 0,
                Descripcion = doc.Descripcion,
                FechaSubida = doc.FechaSubida
            }));
    }

    [HttpGet("documentos/{documentoId:int}/preview")]
    public async Task<IActionResult> PreviewDocumento(int documentoId)
    {
        var doc = await _service.ObtenerDocumentoPorIdAsync(documentoId);
        if (doc is null)
            return NotFound();

        return ServirArchivo(doc.RutaArchivo, inline: true);
    }

    [HttpGet("documentos/{documentoId:int}/download")]
    public async Task<IActionResult> DescargarDocumento(int documentoId)
    {
        var doc = await _service.ObtenerDocumentoPorIdAsync(documentoId);
        if (doc is null)
            return NotFound();

        return ServirArchivo(doc.RutaArchivo, inline: false, nombre: doc.NombreArchivo);
    }

    [HttpDelete("documentos/{documentoId:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> EliminarDocumento(int documentoId)
    {
        var doc = await _service.ObtenerDocumentoPorIdAsync(documentoId);
        if (doc is null)
            return NotFound();

        // Retira también el archivo físico; si ya no existe, se ignora.
        await _storage.EliminarAsync(doc.RutaArchivo);
        await _service.EliminarDocumentoAsync(documentoId);
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

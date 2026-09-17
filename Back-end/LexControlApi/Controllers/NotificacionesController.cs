using LexControlApi.Dtos.Notificaciones;
using LexControlApi.Excepciones;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/notificaciones")]
[Authorize]
public class NotificacionesController : ControllerBase
{
    private readonly INotificacionService _service;
    private readonly IFileStorageService _storage;

    public NotificacionesController(INotificacionService service, IFileStorageService storage)
    {
        _service = service;
        _storage = storage;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NotificacionDto>>>> Listar(
        [FromQuery] int? expedienteId, [FromQuery] int? estadoId,
        [FromQuery] int? tipoId, [FromQuery] int? juzgadoId,
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
    {
        var resultado = await _service.ListarAsync(expedienteId, estadoId, tipoId,
            juzgadoId, fechaInicio, fechaFin);
        return Ok(ApiResponse<List<NotificacionDto>>.Correcto(resultado));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<NotificacionDetalleDto>>> ObtenerPorId(int id)
    {
        var resultado = await _service.ObtenerPorIdAsync(id);
        if (resultado is null)
            return NotFound(ApiResponse<NotificacionDetalleDto>.Fallo("Notificación no encontrada."));
        return Ok(ApiResponse<NotificacionDetalleDto>.Correcto(resultado));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(NotificacionCrearDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<IActionResult> Actualizar(int id, NotificacionActualizarDto dto)
    {
        await _service.ActualizarAsync(id, dto);
        return NoContent();
    }

    [HttpPut("{id:int}/atender")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<IActionResult> Atender(int id, NotificacionAtenderDto dto)
    {
        await _service.AtenderAsync(id, dto);
        return NoContent();
    }

    [HttpPost("verificar-duplicado")]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    public async Task<ActionResult<ApiResponse<List<DuplicadoDto>>>> VerificarDuplicado(
        DuplicadoVerificarDto dto)
    {
        var resultado = await _service.VerificarDuplicadoAsync(dto);
        return Ok(ApiResponse<List<DuplicadoDto>>.Correcto(resultado));
    }

    /// <summary>Sube y asocia un PDF a una notificación existente.</summary>
    [HttpPost("{id:int}/pdf")]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> SubirPdf(
        int id, IFormFile file, [FromForm] string? descripcion = null)
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

        var notificacion = await _service.ObtenerPorIdAsync(id);
        if (notificacion is null)
            return NotFound(ApiResponse<object>.Fallo("Notificación no encontrada."));

        var resultado = await _storage.GuardarAsync(file, notificacion.ExpedienteId, descripcion);
        await _service.AdjuntarPdfAsync(id, resultado.RutaArchivo);

        return Ok(ApiResponse<object>.Correcto(new
        {
            PdfRuta = resultado.RutaArchivo,
            resultado.NombreArchivo,
            resultado.TipoArchivo,
            resultado.Tamano
        }));
    }
}

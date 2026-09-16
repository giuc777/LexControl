using LexControlApi.Dtos.Notificaciones;
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

    public NotificacionesController(INotificacionService service) => _service = service;

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
}

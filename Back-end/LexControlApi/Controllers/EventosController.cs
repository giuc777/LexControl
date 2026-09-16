using LexControlApi.Dtos.Eventos;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/eventos")]
[Authorize]
public class EventosController : ControllerBase
{
    private readonly IEventoService _service;

    public EventosController(IEventoService service) => _service = service;

    [HttpGet("dia")]
    public async Task<ActionResult<ApiResponse<List<EventoDto>>>> ObtenerDelDia(
        [FromQuery] DateTime? fecha)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var usuarioId) || usuarioId <= 0)
            return Unauthorized(ApiResponse<List<EventoDto>>.Fallo("No se pudo identificar al usuario."));

        var f = fecha ?? DateTime.Today;
        var resultado = await _service.ObtenerDelDiaAsync(f, usuarioId);
        return Ok(ApiResponse<List<EventoDto>>.Correcto(resultado));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(EventoCrearDto dto)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var usuarioId) || usuarioId <= 0)
            return Unauthorized(ApiResponse<int>.Fallo("No se pudo identificar al usuario."));

        var id = await _service.CrearAsync(dto, usuarioId);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPost("audiencia")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<ActionResult<ApiResponse<int>>> CrearAudiencia(EventoAudienciaCrearDto dto)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var usuarioId) || usuarioId <= 0)
            return Unauthorized(ApiResponse<int>.Fallo("No se pudo identificar al usuario."));

        var id = await _service.CrearAudienciaAsync(dto, usuarioId);
        return Ok(ApiResponse<int>.Correcto(id));
    }
}

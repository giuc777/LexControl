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
        var usuarioId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var f = fecha ?? DateTime.Today;
        var resultado = await _service.ObtenerDelDiaAsync(f, usuarioId);
        return Ok(ApiResponse<List<EventoDto>>.Correcto(resultado));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(EventoCrearDto dto)
    {
        var usuarioId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var id = await _service.CrearAsync(dto, usuarioId);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPost("audiencia")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<ActionResult<ApiResponse<int>>> CrearAudiencia(EventoAudienciaCrearDto dto)
    {
        var usuarioId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var id = await _service.CrearAudienciaAsync(dto, usuarioId);
        return Ok(ApiResponse<int>.Correcto(id));
    }
}

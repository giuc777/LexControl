using LexControlApi.Dtos.Audiencias;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/audiencias")]
[Authorize]
public class AudienciasController : ControllerBase
{
    private readonly IAudienciaService _service;

    public AudienciasController(IAudienciaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<AudienciaDto>>>> Listar(
        [FromQuery] int? expedienteId, [FromQuery] DateTime? fechaInicio,
        [FromQuery] DateTime? fechaFin, [FromQuery] int? estadoId,
        [FromQuery] int? tipoId)
    {
        var resultado = await _service.ListarAsync(expedienteId, fechaInicio, fechaFin,
            estadoId, tipoId);
        return Ok(ApiResponse<List<AudienciaDto>>.Correcto(resultado));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<AudienciaDetalleDto>>> ObtenerPorId(int id)
    {
        var resultado = await _service.ObtenerPorIdAsync(id);
        if (resultado is null)
            return NotFound(ApiResponse<AudienciaDetalleDto>.Fallo("Audiencia no encontrada."));
        return Ok(ApiResponse<AudienciaDetalleDto>.Correcto(resultado));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(AudienciaCrearDto dto)
    {
        var usuarioId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var id = await _service.CrearAsync(dto, usuarioId);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPut("{id:int}/resultado")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<IActionResult> RegistrarResultado(int id, AudienciaResultadoDto dto)
    {
        var usuarioId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        await _service.RegistrarResultadoAsync(id, dto, usuarioId);
        return NoContent();
    }

    [HttpGet("proximas")]
    public async Task<ActionResult<ApiResponse<List<AudienciaDto>>>> Proximas(
        [FromQuery] int dias = 30)
    {
        var resultado = await _service.ProximasAsync(dias, null);
        return Ok(ApiResponse<List<AudienciaDto>>.Correcto(resultado));
    }
}

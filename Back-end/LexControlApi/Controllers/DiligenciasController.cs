using System.Security.Claims;
using LexControlApi.Dtos.Diligencias;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/diligencias")]
[Authorize]
public class DiligenciasController : ControllerBase
{
    private readonly IDiligenciaService _service;

    public DiligenciasController(IDiligenciaService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<DiligenciaDto>>>> Listar(
        [FromQuery] int? expedienteId, [FromQuery] int? clienteId,
        [FromQuery] int? tipoId, [FromQuery] int? estadoId,
        [FromQuery] int? usuarioId, [FromQuery] DateTime? fechaInicio,
        [FromQuery] DateTime? fechaFin)
    {
        var resultado = await _service.ListarAsync(expedienteId, clienteId, tipoId,
            estadoId, usuarioId, fechaInicio, fechaFin);
        return Ok(ApiResponse<List<DiligenciaDto>>.Correcto(resultado));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<DiligenciaDetalleDto>>> ObtenerPorId(int id)
    {
        var resultado = await _service.ObtenerPorIdAsync(id);
        if (resultado is null)
            return NotFound(ApiResponse<DiligenciaDetalleDto>.Fallo("Diligencia no encontrada."));
        return Ok(ApiResponse<DiligenciaDetalleDto>.Correcto(resultado));
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<ActionResult<ApiResponse<int>>> Crear(DiligenciaCrearDto dto)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var usuarioId) || usuarioId <= 0)
            return Unauthorized(ApiResponse<int>.Fallo("No se pudo identificar al usuario."));

        var id = await _service.CrearAsync(dto, usuarioId);
        return Ok(ApiResponse<int>.Correcto(id));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<IActionResult> Actualizar(int id, DiligenciaActualizarDto dto)
    {
        await _service.ActualizarAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id);
        return NoContent();
    }
}

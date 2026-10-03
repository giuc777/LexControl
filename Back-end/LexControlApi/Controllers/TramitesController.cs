using LexControlApi.Dtos.Tramites;
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

    public TramitesController(ITramiteService service) => _service = service;

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
}

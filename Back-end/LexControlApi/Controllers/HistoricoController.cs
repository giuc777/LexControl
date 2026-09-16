using LexControlApi.Dtos.Historico;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/historico")]
[Authorize]
public class HistoricoController : ControllerBase
{
    private readonly IHistoricoService _service;

    public HistoricoController(IHistoricoService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<HistoricoDto>>>> Listar(
        [FromQuery] int? clienteId, [FromQuery] int? ramaId,
        [FromQuery] int? usuarioId, [FromQuery] string? busqueda,
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
    {
        var resultado = await _service.ListarAsync(clienteId, ramaId, usuarioId,
            busqueda, fechaInicio, fechaFin);
        return Ok(ApiResponse<List<HistoricoDto>>.Correcto(resultado));
    }
}

using LexControlApi.Dtos.Buscar;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/buscar")]
[Authorize]
public class BuscarController : ControllerBase
{
    private readonly IBuscarService _service;

    public BuscarController(IBuscarService service) => _service = service;

    /// <summary>Búsqueda global cross-entidad por texto libre.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<BusquedaResultadoDto>>> Buscar(
        [FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(ApiResponse<BusquedaResultadoDto>.Correcto(new BusquedaResultadoDto()));

        var resultado = await _service.BuscarAsync(q.Trim());
        return Ok(ApiResponse<BusquedaResultadoDto>.Correcto(resultado));
    }
}

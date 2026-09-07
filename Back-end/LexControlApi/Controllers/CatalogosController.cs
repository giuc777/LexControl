using LexControlApi.Dtos.Catalogos;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

/// <summary>CRUD de catálogos del sistema (mantenimiento).</summary>
[ApiController]
[Route("api/catalogos")]
[Authorize]
public class CatalogosController : ControllerBase
{
    private readonly ICatalogoService _catalogoService;

    public CatalogosController(ICatalogoService catalogoService) => _catalogoService = catalogoService;

    // ================================================================
    // Endpoints genéricos para catálogos estándar
    // ================================================================

    /// <summary>Lista ítems de un catálogo estándar con filtros y paginación.</summary>
    /// <param name="tabla">Nombre de la tabla (RAMA, ESTADO_EXPEDIENTE, etc.).</param>
    [HttpGet("{tabla}")]
    [ProducesResponseType(typeof(ApiResponse<List<CatalogoDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<CatalogoDto>>>> BuscarCatalogo(
        string tabla,
        [FromQuery] string? busqueda = null,
        [FromQuery] bool incluirInactivos = false,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 50)
    {
        var (items, total) = await _catalogoService.BuscarCatalogoAsync(
            tabla, busqueda, incluirInactivos, pagina, tamanoPagina);

        Response.Headers.Append("X-Total-Count", total.ToString());
        return Ok(ApiResponse<List<CatalogoDto>>.Correcto(items));
    }

    /// <summary>Obtiene un ítem de catálogo estándar por ID.</summary>
    [HttpGet("{tabla}/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CatalogoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CatalogoDto>>> ObtenerCatalogoPorId(string tabla, int id)
    {
        var item = await _catalogoService.ObtenerCatalogoPorIdAsync(tabla, id);
        return Ok(ApiResponse<CatalogoDto>.Correcto(item));
    }

    /// <summary>Crea un ítem en un catálogo estándar.</summary>
    [HttpPost("{tabla}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<CatalogoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<CatalogoDto>>> InsertarCatalogo(
        string tabla, CatalogoCrearDto datos)
    {
        var item = await _catalogoService.InsertarCatalogoAsync(tabla, datos);
        return CreatedAtAction(nameof(ObtenerCatalogoPorId),
            new { tabla, id = item.Id },
            ApiResponse<CatalogoDto>.Correcto(item));
    }

    /// <summary>Actualiza un ítem de catálogo estándar.</summary>
    [HttpPut("{tabla}/{id:int}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<CatalogoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CatalogoDto>>> ActualizarCatalogo(
        string tabla, int id, CatalogoCrearDto datos)
    {
        var item = await _catalogoService.ActualizarCatalogoAsync(tabla, id, datos);
        return Ok(ApiResponse<CatalogoDto>.Correcto(item));
    }

    /// <summary>Activa o desactiva un ítem de catálogo (borrado lógico).</summary>
    [HttpPut("{tabla}/{id:int}/estado")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CambiarEstadoCatalogo(
        string tabla, int id, CatalogoEstadoDto solicitud)
    {
        await _catalogoService.CambiarEstadoCatalogoAsync(tabla, id, solicitud.Activo);
        return NoContent();
    }

    // ================================================================
    // Endpoints dedicados para Juzgados (tabla con FKs)
    // ================================================================

    /// <summary>Lista juzgados con filtros y paginación.</summary>
    [HttpGet("juzgados")]
    [ProducesResponseType(typeof(ApiResponse<List<JuzgadoDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<JuzgadoDto>>>> BuscarJuzgado(
        [FromQuery] string? busqueda = null,
        [FromQuery] bool incluirInactivos = false,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 50)
    {
        var (items, total) = await _catalogoService.BuscarJuzgadoAsync(
            busqueda, incluirInactivos, pagina, tamanoPagina);

        Response.Headers.Append("X-Total-Count", total.ToString());
        return Ok(ApiResponse<List<JuzgadoDto>>.Correcto(items));
    }

    /// <summary>Obtiene un juzgado por ID.</summary>
    [HttpGet("juzgados/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<JuzgadoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<JuzgadoDto>>> ObtenerJuzgadoPorId(int id)
    {
        var juzgado = await _catalogoService.ObtenerJuzgadoPorIdAsync(id);
        return Ok(ApiResponse<JuzgadoDto>.Correcto(juzgado));
    }

    /// <summary>Crea un juzgado.</summary>
    [HttpPost("juzgados")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<JuzgadoDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<JuzgadoDto>>> InsertarJuzgado(JuzgadoCrearDto datos)
    {
        var juzgado = await _catalogoService.InsertarJuzgadoAsync(datos);
        return CreatedAtAction(nameof(ObtenerJuzgadoPorId),
            new { id = juzgado.Id },
            ApiResponse<JuzgadoDto>.Correcto(juzgado));
    }

    /// <summary>Actualiza un juzgado.</summary>
    [HttpPut("juzgados/{id:int}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<JuzgadoDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<JuzgadoDto>>> ActualizarJuzgado(
        int id, JuzgadoCrearDto datos)
    {
        var juzgado = await _catalogoService.ActualizarJuzgadoAsync(id, datos);
        return Ok(ApiResponse<JuzgadoDto>.Correcto(juzgado));
    }

    /// <summary>Activa o desactiva un juzgado (borrado lógico).</summary>
    [HttpPut("juzgados/{id:int}/estado")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CambiarEstadoJuzgado(int id, CatalogoEstadoDto solicitud)
    {
        await _catalogoService.CambiarEstadoJuzgadoAsync(id, solicitud.Activo);
        return NoContent();
    }
}

using LexControlApi.Dtos.Permisos;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

/// <summary>Matriz de permisos rol × módulo (visibilidad de módulos del SPA).</summary>
[ApiController]
[Route("api/permisos")]
[Authorize]
public class PermisosController : ControllerBase
{
    private readonly IPermisoService _permisoService;

    public PermisosController(IPermisoService permisoService) => _permisoService = permisoService;

    /// <summary>Matriz completa de permisos (todos los roles). Solo Administrador.</summary>
    [HttpGet]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<List<PermisoRolDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<PermisoRolDto>>>> Listar()
    {
        var matriz = await _permisoService.ListarMatrizAsync();
        return Ok(ApiResponse<List<PermisoRolDto>>.Correcto(matriz));
    }

    /// <summary>Módulos visibles para un rol.</summary>
    [HttpGet("{rolId:int}")]
    [ProducesResponseType(typeof(ApiResponse<List<PermisoDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<PermisoDto>>>> ObtenerPorRol(int rolId)
    {
        var permisos = await _permisoService.ObtenerPorRolAsync(rolId);
        return Ok(ApiResponse<List<PermisoDto>>.Correcto(permisos));
    }

    /// <summary>Guarda la matriz completa de un rol (solo Administrador).</summary>
    [HttpPut("{rolId:int}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Guardar(int rolId, PermisoGuardarDto solicitud)
    {
        await _permisoService.GuardarRolAsync(rolId, solicitud);
        return NoContent();
    }
}

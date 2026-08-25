using LexControlApi.Dtos.Perfil;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

/// <summary>Perfil propio y cambio de contraseña del usuario autenticado.</summary>
[ApiController]
[Route("api/perfil")]
[Authorize]
public class PerfilController : ControllerBase
{
    private readonly IPerfilService _perfilService;

    public PerfilController(IPerfilService perfilService) => _perfilService = perfilService;

    /// <summary>Perfil del usuario autenticado.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PerfilDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PerfilDto>>> Obtener()
    {
        var perfil = await _perfilService.ObtenerAsync(User.ObtenerUsuarioId());
        return Ok(ApiResponse<PerfilDto>.Correcto(perfil));
    }

    /// <summary>Actualiza nombre, correo y teléfono del usuario autenticado.</summary>
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Actualizar(PerfilActualizarDto datos)
    {
        await _perfilService.ActualizarAsync(User.ObtenerUsuarioId(), datos);
        return NoContent();
    }

    /// <summary>Cambio de contraseña propia (valida la actual).</summary>
    [HttpPut("contrasena")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CambiarContrasena(CambioContrasenaDto datos)
    {
        await _perfilService.CambiarContrasenaAsync(User.ObtenerUsuarioId(), datos);
        return NoContent();
    }
}

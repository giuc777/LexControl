using LexControlApi.Dtos.Usuarios;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

/// <summary>CRUD de usuarios del sistema (solo Administrador).</summary>
[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "Administrador")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuariosController(IUsuarioService usuarioService) => _usuarioService = usuarioService;

    /// <summary>Lista usuarios con filtros opcionales.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<UsuarioDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<UsuarioDto>>>> Listar(
        [FromQuery] string? filtroNombre,
        [FromQuery] int? rolId,
        [FromQuery] bool? activo)
    {
        var usuarios = await _usuarioService.ListarAsync(filtroNombre, rolId, activo);
        return Ok(ApiResponse<List<UsuarioDto>>.Correcto(usuarios));
    }

    /// <summary>Roles disponibles para el formulario de usuarios.</summary>
    [HttpGet("roles")]
    [ProducesResponseType(typeof(ApiResponse<List<Dtos.Roles.RolDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<Dtos.Roles.RolDto>>>> ListarRoles()
    {
        var roles = await _usuarioService.ListarRolesAsync();
        return Ok(ApiResponse<List<Dtos.Roles.RolDto>>.Correcto(roles));
    }

    /// <summary>Obtiene el detalle de un usuario.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<UsuarioDto>>> ObtenerPorId(int id)
    {
        var usuario = await _usuarioService.ObtenerPorIdAsync(id);
        return Ok(ApiResponse<UsuarioDto>.Correcto(usuario));
    }

    /// <summary>Crea un usuario (Persona + Usuario en transacción).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<UsuarioDto>>> Crear(UsuarioCrearDto datos)
    {
        var usuario = await _usuarioService.CrearAsync(datos);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = usuario.Id },
            ApiResponse<UsuarioDto>.Correcto(usuario));
    }

    /// <summary>Edita un usuario. Contraseña vacía = conservar la actual.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<UsuarioDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<UsuarioDto>>> Actualizar(int id, UsuarioActualizarDto datos)
    {
        var usuario = await _usuarioService.ActualizarAsync(id, datos);
        return Ok(ApiResponse<UsuarioDto>.Correcto(usuario));
    }

    /// <summary>Activa o desactiva una cuenta (no aplica a Administradores).</summary>
    [HttpPut("{id:int}/estado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CambiarEstado(int id, UsuarioEstadoDto solicitud)
    {
        await _usuarioService.ActivarDesactivarAsync(id, solicitud.Activo);
        return NoContent();
    }

    /// <summary>Desbloquea una cuenta tras intentos fallidos de acceso.</summary>
    [HttpPost("{id:int}/desbloquear")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Desbloquear(int id)
    {
        await _usuarioService.DesbloquearAsync(id);
        return NoContent();
    }
}

using LexControlApi.Dtos.Auth;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>Inicia sesión y devuelve un token JWT.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login(LoginRequestDto solicitud)
    {
        var respuesta = await _authService.LoginAsync(solicitud);

        if (respuesta is null)
            return Unauthorized(ApiResponse<LoginResponseDto>.Fallo("Usuario o contraseña incorrectos."));

        return Ok(ApiResponse<LoginResponseDto>.Correcto(respuesta));
    }
}

using System.Security.Claims;
using LexControlApi.Dtos.Auth;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly Data.IRepositorio _repositorio;

    public AuthController(
        IAuthService authService,
        IRefreshTokenService refreshTokenService,
        Data.IRepositorio repositorio)
    {
        _authService = authService;
        _refreshTokenService = refreshTokenService;
        _repositorio = repositorio;
    }

    /// <summary>Inicia sesión y devuelve access token + refresh token.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login(LoginRequestDto solicitud)
    {
        var userAgent = Request.Headers.UserAgent.ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var respuesta = await _authService.LoginAsync(solicitud, userAgent, ipAddress);

        if (respuesta is null)
            return Unauthorized(ApiResponse<LoginResponseDto>.Fallo("Usuario o contraseña incorrectos."));

        return Ok(ApiResponse<LoginResponseDto>.Correcto(respuesta));
    }

    /// <summary>Rotación de refresh token: devuelve un nuevo par de tokens.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Refresh(RefreshRequestDto solicitud)
    {
        var usuario = await _refreshTokenService.ValidarAsync(solicitud.RefreshToken);

        if (usuario is null)
            return Unauthorized(ApiResponse<LoginResponseDto>.Fallo("Refresh token inválido o expirado."));

        // Revocar el refresh token usado (rotación)
        await _refreshTokenService.RevocarAsync(solicitud.RefreshToken);

        // Generar nuevo par de tokens
        var userAgent = Request.Headers.UserAgent.ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var (token, expiracion) = GenerarAccessToken(usuario);
        var nuevoRefreshToken = await _refreshTokenService.CrearAsync(usuario.ID, userAgent, ipAddress);

        var respuesta = new LoginResponseDto
        {
            Token = token,
            Expiracion = expiracion,
            RefreshToken = nuevoRefreshToken,
            UsuarioId = usuario.ID,
            Usuario = usuario.Usuario,
            NombreCompleto = usuario.NombreCompleto,
            RolId = usuario.Rol_ID,
            Rol = usuario.Rol
        };

        return Ok(ApiResponse<LoginResponseDto>.Correcto(respuesta));
    }

    /// <summary>Cierra sesión: revoca refresh token y agrega access token a blacklist.</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(LogoutRequestDto solicitud)
    {
        // Revocar refresh token
        if (!string.IsNullOrEmpty(solicitud.RefreshToken))
            await _refreshTokenService.RevocarAsync(solicitud.RefreshToken);

        // Agregar access token a blacklist
        await AgregarJtiABlacklist("logout");

        return NoContent();
    }

    /// <summary>Cierra sesión en todos los dispositivos.</summary>
    [HttpPost("logout-all")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> LogoutAll()
    {
        var usuarioId = ObtenerUsuarioId();

        // Revocar todos los refresh tokens del usuario
        await _refreshTokenService.RevocarTodosAsync(usuarioId);

        // Agregar access token actual a blacklist
        await AgregarJtiABlacklist("logout-all");

        return NoContent();
    }

    private (string Token, DateTime Expiracion) GenerarAccessToken(Dtos.Usuarios.UsuarioAutenticacionFila usuario)
    {
        var jwtService = HttpContext.RequestServices.GetRequiredService<IJwtService>();
        return jwtService.GenerarAccessToken(usuario.ID, usuario.NombreCompleto, usuario.Usuario, usuario.Rol_ID, usuario.Rol);
    }

    private int ObtenerUsuarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null ? int.Parse(claim.Value) : 0;
    }

    private async Task AgregarJtiABlacklist(string motivo)
    {
        var jtiClaim = User.FindFirst("jti");
        var expClaim = User.FindFirst("exp");

        if (jtiClaim is null || expClaim is null)
            return;

        var jti = jtiClaim.Value;
        var usuarioId = ObtenerUsuarioId();

        // Convertir exp Unix timestamp a DateTime
        var expUnix = long.Parse(expClaim.Value);
        var fechaExpiracion = DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;

        await _repositorio.EjecutarRetornoAsync(
            "SP_TokenBlacklist_Insertar",
            new
            {
                JTI = jti,
                Usuario_ID = usuarioId,
                FechaExpiracion = fechaExpiracion,
                Motivo = motivo
            });
    }
}

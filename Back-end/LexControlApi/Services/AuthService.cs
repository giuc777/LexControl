using LexControlApi.Dtos.Auth;
using LexControlApi.Dtos.Usuarios;

namespace LexControlApi.Services;

/// <summary>Autenticación de usuarios y emisión de tokens JWT.</summary>
public interface IAuthService
{
    /// <summary>Valida credenciales; null si son inválidas o la cuenta está bloqueada.</summary>
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto solicitud, string? userAgent, string? ipAddress);
}

public class AuthService : IAuthService
{
    private readonly Data.IRepositorio _repositorio;
    private readonly IJwtService _jwtService;
    private readonly IRefreshTokenService _refreshTokenService;

    public AuthService(
        Data.IRepositorio repositorio,
        IJwtService jwtService,
        IRefreshTokenService refreshTokenService)
    {
        _repositorio = repositorio;
        _jwtService = jwtService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto solicitud, string? userAgent, string? ipAddress)
    {
        // Paso 1: Intentar autenticar con SHA256 (legacy)
        var hashLegacy = Helpers.HashHelper.Sha256Hex(solicitud.Contrasena);

        var fila = await _repositorio.ConsultarPrimeroAsync<AutenticacionFila>(
            "SP_Usuario_Autenticar",
            new { Usuario = solicitud.Usuario, ContraseñaHash = hashLegacy });

        if (fila is not null)
        {
            // Si el hash es legacy, migrar a BCrypt transparentemente
            if (fila.HashLegacy)
            {
                var nuevoHash = Helpers.HashHelper.HashPassword(solicitud.Contrasena);
                await _repositorio.EjecutarRetornoAsync(
                    "SP_Usuario_ActualizarHash",
                    new { ID = fila.ID, ContraseñaHash = nuevoHash, HashLegacy = false });
            }

            return await GenerarRespuestaAsync(fila.ID, fila.NombreCompleto, fila.Usuario, fila.Rol_ID, fila.RolNombre, userAgent, ipAddress);
        }

        // Paso 2: Fallback — intentar con BCrypt
        var candidato = await _repositorio.ConsultarPrimeroAsync<UsuarioAutenticacionFila>(
            "SP_Usuario_ObtenerPorNombre",
            new { Usuario = solicitud.Usuario });

        if (candidato is not null
            && !candidato.Bloqueado
            && Helpers.HashHelper.EsHashBcrypt(candidato.ContraseñaHash)
            && Helpers.HashHelper.VerifyPassword(solicitud.Contrasena, candidato.ContraseñaHash))
        {
            return await GenerarRespuestaAsync(candidato.ID, candidato.NombreCompleto, candidato.Usuario, candidato.Rol_ID, candidato.Rol, userAgent, ipAddress);
        }

        // Paso 3: Credenciales inválidas — registrar intento fallido
        await _repositorio.EjecutarRetornoAsync(
            "SP_Usuario_RegistrarIntentoFallido", new { Usuario = solicitud.Usuario });

        return null;
    }

    private async Task<LoginResponseDto> GenerarRespuestaAsync(
        int usuarioId, string nombreCompleto, string usuario, int rolId, string rol,
        string? userAgent, string? ipAddress)
    {
        // Generar access token (15 min)
        var (token, expiracion) = _jwtService.GenerarAccessToken(usuarioId, nombreCompleto, usuario, rolId, rol);

        // Generar refresh token (7 días)
        var refreshToken = await _refreshTokenService.CrearAsync(usuarioId, userAgent, ipAddress);

        // Actualizar último acceso
        await _repositorio.EjecutarRetornoAsync(
            "SP_Usuario_ActualizarAcceso", new { Usuario = usuario });

        return new LoginResponseDto
        {
            Token = token,
            Expiracion = expiracion,
            RefreshToken = refreshToken,
            UsuarioId = usuarioId,
            Usuario = usuario,
            NombreCompleto = nombreCompleto,
            RolId = rolId,
            Rol = rol
        };
    }
}

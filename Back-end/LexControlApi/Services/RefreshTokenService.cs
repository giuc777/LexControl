using System.Security.Cryptography;
using System.Text;
using LexControlApi.Dtos.Auth;
using LexControlApi.Dtos.Usuarios;

namespace LexControlApi.Services;

/// <summary>Servicio de gestión de refresh tokens.</summary>
public interface IRefreshTokenService
{
    /// <summary>Crea un refresh token para un usuario y devuelve el token en claro.</summary>
    Task<string> CrearAsync(int usuarioId, string? userAgent, string? ipAddress);

    /// <summary>Valida un refresh token y devuelve los datos del usuario si es válido.</summary>
    Task<UsuarioAutenticacionFila?> ValidarAsync(string refreshToken);

    /// <summary>Decodifica un JWT sin validarlo (para extraer claims del access token).</summary>
    System.Security.Claims.ClaimsPrincipal? DecodificarTokenSinValidar(string token);

    /// <summary>Revoca un refresh token específico.</summary>
    Task RevocarAsync(string refreshToken);

    /// <summary>Revoca todos los refresh tokens de un usuario (logout global).</summary>
    Task RevocarTodosAsync(int usuarioId);
}

public class RefreshTokenService : IRefreshTokenService
{
    private readonly Data.IRepositorio _repositorio;
    private readonly IConfiguration _configuracion;
    private readonly int _diasExpiracion;

    public RefreshTokenService(Data.IRepositorio repositorio, IConfiguration configuracion)
    {
        _repositorio = repositorio;
        _configuracion = configuracion;

        var jwt = configuracion.GetSection("Jwt");
        _diasExpiracion = int.TryParse(jwt["RefreshTokenDays"], out var d) ? d : 7;
    }

    public async Task<string> CrearAsync(int usuarioId, string? userAgent, string? ipAddress)
    {
        // Generar 64 bytes aleatorios y codificar en base64url
        var bytes = RandomNumberGenerator.GetBytes(64);
        var tokenClaro = Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        // Hashear el token para guardar en BD (nunca guardar en claro)
        var tokenHash = CalcularHash(tokenClaro);

        var fechaExpiracion = DateTime.UtcNow.AddDays(_diasExpiracion);

        await _repositorio.EjecutarRetornoAsync(
            "SP_RefreshToken_Crear",
            new
            {
                Usuario_ID = usuarioId,
                TokenHash = tokenHash,
                FechaExpiracion = fechaExpiracion,
                UserAgent = userAgent,
                IPAddress = ipAddress
            });

        return tokenClaro;
    }

    public async Task<UsuarioAutenticacionFila?> ValidarAsync(string refreshToken)
    {
        var tokenHash = CalcularHash(refreshToken);

        var fila = await _repositorio.ConsultarPrimeroAsync<UsuarioAutenticacionFila>(
            "SP_RefreshToken_Validar",
            new { TokenHash = tokenHash });

        return fila;
    }

    public System.Security.Claims.ClaimsPrincipal? DecodificarTokenSinValidar(string token)
    {
        try
        {
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var parameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = false,
                ValidateIssuerSigningKey = false,
                RequireExpirationTime = false
            };

            var principal = handler.ValidateToken(token, parameters, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public async Task RevocarAsync(string refreshToken)
    {
        var tokenHash = CalcularHash(refreshToken);

        await _repositorio.EjecutarRetornoAsync(
            "SP_RefreshToken_Revocar",
            new { TokenHash = tokenHash, ReemplazadoPor = (string?)null });
    }

    public async Task RevocarTodosAsync(int usuarioId)
    {
        await _repositorio.EjecutarRetornoAsync(
            "SP_RefreshToken_RevocarTodos",
            new { Usuario_ID = usuarioId });
    }

    private static string CalcularHash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

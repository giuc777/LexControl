using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace LexControlApi.Services;

/// <summary>Servicio de generación de tokens JWT.</summary>
public interface IJwtService
{
    /// <summary>
    /// Genera un access token con expiración corta (15 min).
    /// Claims: NameIdentifier, Name, usuario, rol_id, Role, jti (Guid), exp.
    /// </summary>
    (string Token, DateTime Expiracion) GenerarAccessToken(
        int usuarioId, string nombreCompleto, string usuario, int rolId, string rol);
}

public class JwtService : IJwtService
{
    private readonly string _secreto;
    private readonly string _emisor;
    private readonly string _audiencia;
    private readonly int _minutosExpiracion;

    public JwtService(IConfiguration configuracion)
    {
        var jwt = configuracion.GetSection("Jwt");
        _secreto = Environment.GetEnvironmentVariable("JWT_SECRET") ?? jwt["Secret"]
            ?? throw new InvalidOperationException("Falta la clave 'Jwt:Secret'. Establezca la variable de entorno JWT_SECRET.");
        _emisor = jwt["Issuer"] ?? "LexControlApi";
        _audiencia = jwt["Audience"] ?? "LexControlApp";
        _minutosExpiracion = int.TryParse(jwt["AccessTokenMinutes"], out var m) ? m : 15;

        if (_secreto.Length < 32)
            throw new InvalidOperationException("La clave 'Jwt:Secret' debe tener al menos 32 caracteres.");
    }

    public (string Token, DateTime Expiracion) GenerarAccessToken(
        int usuarioId, string nombreCompleto, string usuario, int rolId, string rol)
    {
        var expiracion = DateTime.UtcNow.AddMinutes(_minutosExpiracion);
        var jti = Guid.NewGuid().ToString();

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuarioId.ToString()),
            new(ClaimTypes.Name, nombreCompleto),
            new("usuario", usuario),
            new("rol_id", rolId.ToString()),
            new(ClaimTypes.Role, rol),
            new(JwtRegisteredClaimNames.Jti, jti)
        };

        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secreto)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _emisor,
            audience: _audiencia,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiracion,
            signingCredentials: credenciales);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        return (tokenString, expiracion);
    }
}

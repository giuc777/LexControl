using LexControlApi.Dtos.Auth;
using LexControlApi.Dtos.Usuarios;

namespace LexControlApi.Services;

/// <summary>Autenticación de usuarios y emisión de tokens JWT.</summary>
public interface IAuthService
{
    /// <summary>Valida credenciales; null si son inválidas o la cuenta está bloqueada.</summary>
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto solicitud);
}

public class AuthService : IAuthService
{
    private readonly Data.IRepositorio _repositorio;
    private readonly IConfiguration _configuracion;
    private readonly string _secreto;
    private readonly string _emisor;
    private readonly string _audiencia;
    private readonly int _minutosExpiracion;

    public AuthService(Data.IRepositorio repositorio, IConfiguration configuracion)
    {
        _repositorio = repositorio;
        _configuracion = configuracion;

        var jwt = configuracion.GetSection("Jwt");
        _secreto = jwt["Secret"] ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? throw new InvalidOperationException("Falta la clave 'Jwt:Secret'.");
        _emisor = jwt["Issuer"] ?? "LexControlApi";
        _audiencia = jwt["Audience"] ?? "LexControlApp";
        _minutosExpiracion = int.TryParse(jwt["ExpiryMinutes"], out var m) ? m : 120;

        if (_secreto.Length < 32)
            throw new InvalidOperationException("La clave 'Jwt:Secret' debe tener al menos 32 caracteres.");
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto solicitud)
    {
        var hash = Helpers.HashHelper.Sha256Hex(solicitud.Contrasena);

        var fila = await _repositorio.ConsultarPrimeroAsync<AutenticacionFila>(
            "SP_Usuario_Autenticar",
            new { Usuario = solicitud.Usuario, ContraseñaHash = hash });

        if (fila is null)
        {
            // La cuenta puede no existir, tener hash distinto o estar bloqueada;
            // se responde igual para no filtrar información.
            await _repositorio.EjecutarRetornoAsync(
                "SP_Usuario_RegistrarIntentoFallido", new { Usuario = solicitud.Usuario });
            return null;
        }

        await _repositorio.EjecutarRetornoAsync(
            "SP_Usuario_ActualizarAcceso", new { Usuario = fila.Usuario });

        return GenerarToken(fila);
    }

    private LoginResponseDto GenerarToken(AutenticacionFila fila)
    {
        var expiracion = DateTime.UtcNow.AddMinutes(_minutosExpiracion);
        var claims = new List<System.Security.Claims.Claim>
        {
            new(System.Security.Claims.ClaimTypes.NameIdentifier, fila.ID.ToString()),
            new(System.Security.Claims.ClaimTypes.Name, fila.NombreCompleto),
            new("usuario", fila.Usuario),
            new("rol_id", fila.Rol_ID.ToString()),
            new(System.Security.Claims.ClaimTypes.Role, fila.RolNombre)
        };

        var credenciales = new Microsoft.IdentityModel.Tokens.SigningCredentials(
            new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(_secreto)),
            Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);

        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            issuer: _emisor,
            audience: _audiencia,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiracion,
            signingCredentials: credenciales);

        return new LoginResponseDto
        {
            Token = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token),
            Expiracion = expiracion,
            UsuarioId = fila.ID,
            Usuario = fila.Usuario,
            NombreCompleto = fila.NombreCompleto,
            RolId = fila.Rol_ID,
            Rol = fila.RolNombre
        };
    }
}

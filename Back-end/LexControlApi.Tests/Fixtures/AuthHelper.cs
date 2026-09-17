using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace LexControlApi.Tests.Fixtures;

/// <summary>
/// Helper para generar tokens JWT y configurar HttpClient autenticado.
/// </summary>
public static class AuthHelper
{
    /// <summary>Genera un JWT válido con los claims del admin.</summary>
    public static string GenerarTokenAdmin()
    {
        return GenerarToken(usuarioId: 1, nombreCompleto: "Administrador",
            usuario: "admin", rolId: 1, rol: "Administrador");
    }

    /// <summary>Genera un JWT válido con los claims de un abogado.</summary>
    public static string GenerarTokenAbogado(int usuarioId = 2)
    {
        return GenerarToken(usuarioId, nombreCompleto: "Lic. Diego Matzar",
            usuario: "diego.matzar", rolId: 3, rol: "Abogado");
    }

    /// <summary>Genera un JWT válido con los claims de una secretaria.</summary>
    public static string GenerarTokenSecretaria(int usuarioId = 3)
    {
        return GenerarToken(usuarioId, nombreCompleto: "María López",
            usuario: "maria.lopez", rolId: 2, rol: "Secretaria");
    }

    /// <summary>Genera un JWT con los parámetros especificados.</summary>
    public static string GenerarToken(
        int usuarioId, string nombreCompleto, string usuario,
        int rolId, string rol, DateTime? expiracion = null)
    {
        var exp = expiracion ?? DateTime.UtcNow.AddMinutes(60);
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
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestWebApplicationFactory.JwtTestSecret)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "LexControlApi",
            audience: "LexControlApp",
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: exp,
            signingCredentials: credenciales);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Realiza login con las credenciales admin y devuelve un HttpClient autenticado.
    /// </summary>
    public static async Task<HttpClient> LoginAsAdminAsync(HttpClient client)
    {
        var token = GenerarTokenAdmin();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    /// <summary>
    /// Obtiene un token real haciendo login con admin/admin123 contra el API.
    /// </summary>
    public static async Task<(string Token, int UsuarioId)> LoginRealAsync(HttpClient client)
    {
        var loginData = new { Usuario = "admin", Contrasena = "admin123" };
        var response = await client.PostAsJsonAsync("/api/auth/login", loginData);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<LoginApiResponse>();
        var usuarioId = body?.Data?.UsuarioId ?? 1;
        return (body!.Data!.Token, usuarioId);
    }

    /// <summary>Realiza login real y agrega el header Authorization al HttpClient.</summary>
    public static async Task<HttpClient> LoginRealAsync(
        HttpClient client, string usuario, string contrasena)
    {
        var loginData = new { Usuario = usuario, Contrasena = contrasena };
        var response = await client.PostAsJsonAsync("/api/auth/login", loginData);
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<LoginApiResponse>();
        if (body?.Data?.Token is not null)
        {
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", body.Data.Token);
        }
        return client;
    }

    // Tipos auxiliares para deserializar la respuesta de login
    public class LoginApiResponse
    {
        public bool Success { get; set; }
        public LoginData? Data { get; set; }
    }

    public class LoginData
    {
        public string Token { get; set; } = string.Empty;
        public int UsuarioId { get; set; }
        public string Usuario { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public int RolId { get; set; }
        public string Rol { get; set; } = string.Empty;
    }
}

using System.Security.Cryptography;
using System.Text;

namespace LexControlApi.Helpers;

/// <summary>
/// Utilidades de hashing de contraseñas.
/// Soporta BCrypt (actual) y SHA256 (legacy, para migración).
/// </summary>
public static class HashHelper
{
    // Work factor 12 ≈ 250ms por hash en hardware moderno
    private const int WorkFactor = 12;

    /// <summary>
    /// Genera hash BCrypt con salt embebido.
    /// Devuelve string de 60 chars con prefijo $2a$12$.
    /// </summary>
    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    /// <summary>
    /// Verifica contraseña contra hash BCrypt.
    /// Captura SaltParseException y devuelve false en caso de error.
    /// </summary>
    public static bool VerifyPassword(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch
        {
            // Si el hash no es BCrypt válido o hay error de formato
            return false;
        }
    }

    /// <summary>
    /// Detecta si un hash es BCrypt (empieza con $2a$, $2b$ o $2y$).
    /// </summary>
    public static bool EsHashBcrypt(string hash)
    {
        return hash.StartsWith("$2a$") || hash.StartsWith("$2b$") || hash.StartsWith("$2y$");
    }

    /// <summary>
    /// [LEGACY] SHA256 hex sin salt. Solo para migración de hashes existentes.
    /// </summary>
    [Obsolete("Solo para migración de hashes SHA256 legacy. Usar HashPassword para nuevos hashes.")]
    public static string Sha256Hex(string texto)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(texto));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

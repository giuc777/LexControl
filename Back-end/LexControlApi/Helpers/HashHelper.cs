using System.Security.Cryptography;
using System.Text;

namespace LexControlApi.Helpers;

/// <summary>
/// Hash SHA256 en hexadecimal minúscula, compatible con el seed de la BD
/// (p. ej. admin123 → 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9).
/// Nota: SHA256 sin salt es una debilidad conocida heredada de Base_Datos.sql;
/// migrar a PBKDF2/BCrypt requiere actualizar también los hashes en BD.
/// </summary>
public static class HashHelper
{
    public static string Sha256Hex(string texto)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(texto));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

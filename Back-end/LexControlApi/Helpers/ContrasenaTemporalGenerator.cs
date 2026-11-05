using System.Security.Cryptography;

namespace LexControlApi.Helpers;

/// <summary>
/// Genera contraseñas temporales aleatorias que cumplen la política
/// del sistema (mínimo 8 caracteres, al menos un dígito y un especial).
/// Usa aleatoriedad criptográfica (CSPRNG).
/// </summary>
public static class ContrasenaTemporalGenerator
{
    private const string Minusculas = "abcdefghijkmnopqrstuvwxyz";
    private const string Mayusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private const string Digitos = "23456789";
    private const string Especiales = "!@#$%&*?+-=";

    /// <summary>Genera una contraseña aleatoria de 12 caracteres.</summary>
    public static string Generar(int longitud = 12)
    {
        var chars = new List<char>
        {
            Minusculas[RandomNumberGenerator.GetInt32(Minusculas.Length)],
            Mayusculas[RandomNumberGenerator.GetInt32(Mayusculas.Length)],
            Digitos[RandomNumberGenerator.GetInt32(Digitos.Length)],
            Especiales[RandomNumberGenerator.GetInt32(Especiales.Length)]
        };

        var todos = Minusculas + Mayusculas + Digitos + Especiales;
        while (chars.Count < longitud)
            chars.Add(todos[RandomNumberGenerator.GetInt32(todos.Length)]);

        // Fisher-Yates con aleatoriedad criptográfica
        for (var i = chars.Count - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }

        return new string(chars.ToArray());
    }
}

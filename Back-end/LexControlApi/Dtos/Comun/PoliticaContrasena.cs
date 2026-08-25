namespace LexControlApi.Dtos.Comun;

/// <summary>Reglas de contraseña replicadas del prototipo (ajustes-comun.js).</summary>
public static class PoliticaContrasena
{
    /// <summary>Mínimo 8 caracteres, al menos un dígito y un carácter especial.</summary>
    public const string Regex =
        @"^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$";

    public const string Mensaje =
        "La contraseña debe tener al menos 8 caracteres e incluir números y caracteres especiales.";
}

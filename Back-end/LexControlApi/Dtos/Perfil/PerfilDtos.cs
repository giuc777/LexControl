using System.ComponentModel.DataAnnotations;
using LexControlApi.Dtos.Comun;

namespace LexControlApi.Dtos.Perfil;

/// <summary>Perfil del usuario autenticado.</summary>
public class PerfilDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public int RolId { get; set; }
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
}

/// <summary>Actualización del perfil propio.</summary>
public class PerfilActualizarDto
{
    [Required(ErrorMessage = "El nombre completo es obligatorio.")]
    [MaxLength(100, ErrorMessage = "El nombre completo no puede exceder 100 caracteres.")]
    public string NombreCompleto { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [EmailAddress(ErrorMessage = "Ingrese un correo electrónico válido.")]
    [MaxLength(100, ErrorMessage = "El correo electrónico no puede exceder 100 caracteres.")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "El teléfono no puede exceder 20 caracteres.")]
    public string? Telefono { get; set; }
}

/// <summary>Cambio de contraseña propia (reglas del prototipo).</summary>
public class CambioContrasenaDto
{
    [Required(ErrorMessage = "La contraseña actual es obligatoria.")]
    public string ContrasenaActual { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es obligatoria.")]
    [RegularExpression(PoliticaContrasena.Regex, ErrorMessage = PoliticaContrasena.Mensaje)]
    public string ContrasenaNueva { get; set; } = string.Empty;

    [Required(ErrorMessage = "La confirmación es obligatoria.")]
    [Compare(nameof(ContrasenaNueva), ErrorMessage = "La confirmación no coincide con la nueva contraseña.")]
    public string Confirmacion { get; set; } = string.Empty;
}

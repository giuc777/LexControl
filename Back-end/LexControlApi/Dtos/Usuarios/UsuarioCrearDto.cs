using System.ComponentModel.DataAnnotations;
using LexControlApi.Dtos.Comun;

namespace LexControlApi.Dtos.Usuarios;

/// <summary>Datos para crear un usuario (contraseña obligatoria).</summary>
public class UsuarioCrearDto
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

    [Required(ErrorMessage = "El nombre de cuenta es obligatorio.")]
    [MaxLength(50, ErrorMessage = "La cuenta no puede exceder 50 caracteres.")]
    [RegularExpression(@"^[A-Za-z0-9._-]+$",
        ErrorMessage = "La cuenta solo admite letras, números, punto, guion y guion bajo.")]
    public string Cuenta { get; set; } = string.Empty;

    [Required(ErrorMessage = "Debe seleccionar un rol válido.")]
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un rol válido.")]
    public int RolId { get; set; }

    [Required(ErrorMessage = "Debe asignar una contraseña al usuario.")]
    [RegularExpression(PoliticaContrasena.Regex, ErrorMessage = PoliticaContrasena.Mensaje)]
    public string Contrasena { get; set; } = string.Empty;
}

/// <summary>Datos para editar un usuario (contraseña vacía = conservar la actual).</summary>
public class UsuarioActualizarDto
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

    [Required(ErrorMessage = "El nombre de cuenta es obligatorio.")]
    [MaxLength(50, ErrorMessage = "La cuenta no puede exceder 50 caracteres.")]
    [RegularExpression(@"^[A-Za-z0-9._-]+$",
        ErrorMessage = "La cuenta solo admite letras, números, punto, guion y guion bajo.")]
    public string Cuenta { get; set; } = string.Empty;

    [Required(ErrorMessage = "Debe seleccionar un rol válido.")]
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un rol válido.")]
    public int RolId { get; set; }

    /// <summary>Vacío o nulo conserva la contraseña actual (según prototipo).</summary>
    [RegularExpression(PoliticaContrasena.Regex, ErrorMessage = PoliticaContrasena.Mensaje)]
    public string? Contrasena { get; set; }
}

/// <summary>Solicitud de activación/desactivación de cuenta.</summary>
public class UsuarioEstadoDto
{
    [Required(ErrorMessage = "El estado es obligatorio.")]
    public bool Activo { get; set; }
}

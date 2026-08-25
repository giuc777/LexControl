using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Auth;

/// <summary>Solicitud de inicio de sesión.</summary>
public class LoginRequestDto
{
    [Required(ErrorMessage = "El usuario es obligatorio.")]
    public string Usuario { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string Contrasena { get; set; } = string.Empty;
}

/// <summary>Respuesta exitosa de inicio de sesión.</summary>
public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime Expiracion { get; set; }
    public int UsuarioId { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public int RolId { get; set; }
    public string Rol { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Usuarios;

/// <summary>Fila cruda devuelta por los SPs de usuario (mapeo Dapper).</summary>
public class UsuarioFila
{
    public int ID { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public int Rol_ID { get; set; }
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public bool Bloqueado { get; set; }
    public DateTime? UltimoAcceso { get; set; }
    public DateTime FechaCreacion { get; set; }
}

/// <summary>Fila del SP_Usuario_Autenticar.</summary>
public class AutenticacionFila
{
    public int ID { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public int Rol_ID { get; set; }
    public string RolNombre { get; set; } = string.Empty;
    public bool Bloqueado { get; set; }
}

/// <summary>Usuario expuesto al frontend.</summary>
public class UsuarioDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public int RolId { get; set; }
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public bool Bloqueado { get; set; }
    public DateTime? UltimoAcceso { get; set; }
    public DateTime FechaCreacion { get; set; }

    public static UsuarioDto Desde(UsuarioFila fila) => new()
    {
        Id = fila.ID,
        NombreCompleto = fila.NombreCompleto,
        Usuario = fila.Usuario,
        Email = fila.Email,
        Telefono = fila.Telefono,
        RolId = fila.Rol_ID,
        Rol = fila.Rol,
        Activo = fila.Activo,
        Bloqueado = fila.Bloqueado,
        UltimoAcceso = fila.UltimoAcceso,
        FechaCreacion = fila.FechaCreacion
    };
}

using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Permisos;

/// <summary>Permiso de un módulo para un rol (fila de la matriz).</summary>
public class PermisoDto
{
    public string Clave { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Ruta { get; set; }
    public string? Icono { get; set; }
    public int Orden { get; set; }
    public bool Activo { get; set; }
}

/// <summary>Matriz de permisos agrupada por rol.</summary>
public class PermisoRolDto
{
    public int RolId { get; set; }
    public string Rol { get; set; } = string.Empty;
    public List<PermisoDto> Modulos { get; set; } = new();
}

/// <summary>Fila cruda devuelta por los SPs de permisos (mapeo Dapper).</summary>
public class PermisoFila
{
    public int Rol_ID { get; set; }
    public string Rol { get; set; } = string.Empty;
    public string ModuloClave { get; set; } = string.Empty;
    public string Modulo { get; set; } = string.Empty;
    public string? Ruta { get; set; }
    public string? Icono { get; set; }
    public int Orden { get; set; }
    public bool Activo { get; set; }
}

/// <summary>Solicitud para guardar la matriz completa de un rol.</summary>
public class PermisoGuardarDto
{
    [Required(ErrorMessage = "La matriz de módulos es obligatoria.")]
    [MinLength(1, ErrorMessage = "Debe incluir al menos un módulo.")]
    public Dictionary<string, bool> Modulos { get; set; } = new();
}

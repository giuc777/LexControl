namespace LexControlApi.Dtos.Roles;

/// <summary>Rol de usuario (catálogo ROL).</summary>
public class RolDto
{
    public int ID { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

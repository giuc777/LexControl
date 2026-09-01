using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Clientes;

/// <summary>Fila cruda devuelta por los SPs de cliente (mapeo Dapper).</summary>
public class ClienteFila
{
    public int ClienteID { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string? DPI { get; set; }
    public string? TelefonoPrincipal { get; set; }
    public string? EmailPrincipal { get; set; }
    public string? Direccion { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public string? Genero { get; set; }
    public string? TelefonoSecundario { get; set; }
    public string? EmailSecundario { get; set; }
    public string TipoCliente { get; set; } = "Particular";
    public string? ClienteNotas { get; set; }
    public bool ClienteActivo { get; set; }
    public DateTime FechaCreacion { get; set; }
    public int TotalExpedientes { get; set; }
    public int ExpedientesActivos { get; set; }
    public DateTime? UltimaActividad { get; set; }
    public int TotalRegistros { get; set; }
}

/// <summary>Fila del SP_Cliente_ObtenerPorID.</summary>
public class ClienteDetalleFila
{
    public int ClienteID { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string? DPI { get; set; }
    public string? TelefonoPrincipal { get; set; }
    public string? EmailPrincipal { get; set; }
    public string? Direccion { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public string? Genero { get; set; }
    public string? TelefonoSecundario { get; set; }
    public string? EmailSecundario { get; set; }
    public string TipoCliente { get; set; } = "Particular";
    public string? ClienteNotas { get; set; }
    public bool ClienteActivo { get; set; }
    public DateTime FechaCreacion { get; set; }
}

/// <summary>Cliente expuesto al frontend (listado).</summary>
public class ClienteDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string? DPI { get; set; }
    public string? TelefonoPrincipal { get; set; }
    public string? EmailPrincipal { get; set; }
    public string? Direccion { get; set; }
    public string? FechaNacimiento { get; set; }
    public string? Genero { get; set; }
    public string? TelefonoSecundario { get; set; }
    public string? EmailSecundario { get; set; }
    public string TipoCliente { get; set; } = "Particular";
    public string? Notas { get; set; }
    public bool Activo { get; set; }
    public string? FechaCreacion { get; set; }
    public int TotalExpedientes { get; set; }
    public int ExpedientesActivos { get; set; }
    public string? UltimaActividad { get; set; }

    public static ClienteDto Desde(ClienteFila fila) => new()
    {
        Id = fila.ClienteID,
        NombreCompleto = fila.NombreCompleto,
        DPI = fila.DPI,
        TelefonoPrincipal = fila.TelefonoPrincipal,
        EmailPrincipal = fila.EmailPrincipal,
        Direccion = fila.Direccion,
        FechaNacimiento = fila.FechaNacimiento?.ToString("yyyy-MM-dd"),
        Genero = fila.Genero,
        TelefonoSecundario = fila.TelefonoSecundario,
        EmailSecundario = fila.EmailSecundario,
        TipoCliente = fila.TipoCliente,
        Notas = fila.ClienteNotas,
        Activo = fila.ClienteActivo,
        FechaCreacion = fila.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss"),
        TotalExpedientes = fila.TotalExpedientes,
        ExpedientesActivos = fila.ExpedientesActivos,
        UltimaActividad = fila.UltimaActividad?.ToString("yyyy-MM-dd")
    };
}

/// <summary>Cliente expuesto al frontend (detalle, sin campos de paginación).</summary>
public class ClienteDetalleDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string? DPI { get; set; }
    public string? TelefonoPrincipal { get; set; }
    public string? EmailPrincipal { get; set; }
    public string? Direccion { get; set; }
    public string? FechaNacimiento { get; set; }
    public string? Genero { get; set; }
    public string? TelefonoSecundario { get; set; }
    public string? EmailSecundario { get; set; }
    public string TipoCliente { get; set; } = "Particular";
    public string? Notas { get; set; }
    public bool Activo { get; set; }
    public string? FechaCreacion { get; set; }

    public static ClienteDetalleDto Desde(ClienteDetalleFila fila) => new()
    {
        Id = fila.ClienteID,
        NombreCompleto = fila.NombreCompleto,
        DPI = fila.DPI,
        TelefonoPrincipal = fila.TelefonoPrincipal,
        EmailPrincipal = fila.EmailPrincipal,
        Direccion = fila.Direccion,
        FechaNacimiento = fila.FechaNacimiento?.ToString("yyyy-MM-dd"),
        Genero = fila.Genero,
        TelefonoSecundario = fila.TelefonoSecundario,
        EmailSecundario = fila.EmailSecundario,
        TipoCliente = fila.TipoCliente,
        Notas = fila.ClienteNotas,
        Activo = fila.ClienteActivo,
        FechaCreacion = fila.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Estadísticas del bento grid.</summary>
public class EstadisticasClienteDto
{
    public int TotalClientes { get; set; }
    public int TotalInactivos { get; set; }
    public int TotalExpedientesActivos { get; set; }
    public int TotalExpedientes { get; set; }
}

/// <summary>Datos de entrada para crear un cliente.</summary>
public class ClienteCrearDto
{
    [Required(ErrorMessage = "El nombre completo es obligatorio.")]
    [MaxLength(100)]
    public string NombreCompleto { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? DPI { get; set; }

    [MaxLength(20)]
    public string? TelefonoPrincipal { get; set; }

    [EmailAddress(ErrorMessage = "El correo electrónico no es válido.")]
    [MaxLength(100)]
    public string? EmailPrincipal { get; set; }

    [MaxLength(200)]
    public string? Direccion { get; set; }

    [MaxLength(20)]
    public string? TelefonoSecundario { get; set; }

    [EmailAddress(ErrorMessage = "El correo secundario no es válido.")]
    [MaxLength(100)]
    public string? EmailSecundario { get; set; }

    [MaxLength(20)]
    public string? TipoCliente { get; set; }

    [MaxLength(500)]
    public string? Notas { get; set; }
}

/// <summary>Datos de entrada para actualizar un cliente.</summary>
public class ClienteActualizarDto
{
    [Required(ErrorMessage = "El nombre completo es obligatorio.")]
    [MaxLength(100)]
    public string NombreCompleto { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? DPI { get; set; }

    [MaxLength(20)]
    public string? TelefonoPrincipal { get; set; }

    [EmailAddress(ErrorMessage = "El correo electrónico no es válido.")]
    [MaxLength(100)]
    public string? EmailPrincipal { get; set; }

    [MaxLength(200)]
    public string? Direccion { get; set; }

    public DateTime? FechaNacimiento { get; set; }

    [MaxLength(1)]
    public string? Genero { get; set; }

    [MaxLength(20)]
    public string? TelefonoSecundario { get; set; }

    [EmailAddress(ErrorMessage = "El correo secundario no es válido.")]
    [MaxLength(100)]
    public string? EmailSecundario { get; set; }

    [MaxLength(20)]
    public string? TipoCliente { get; set; }

    [MaxLength(500)]
    public string? Notas { get; set; }
}

/// <summary>Fila del SP_Cliente_ObtenerExpedientes.</summary>
public class ClienteExpedienteFila
{
    public int ExpedienteID { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public DateTime FechaIngreso { get; set; }
    public string? Descripcion { get; set; }
    public string Rama { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Juzgado { get; set; }
    public string? UltimaActuacion { get; set; }
    public DateTime? FechaUltimaActuacion { get; set; }
}

/// <summary>Expediente de un cliente (para el detalle).</summary>
public class ClienteExpedienteDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string? FechaIngreso { get; set; }
    public string? Descripcion { get; set; }
    public string Rama { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Juzgado { get; set; }
    public string? UltimaActuacion { get; set; }
    public string? FechaUltimaActuacion { get; set; }

    public static ClienteExpedienteDto Desde(ClienteExpedienteFila fila) => new()
    {
        Id = fila.ExpedienteID,
        Numero = fila.NoExpediente,
        FechaIngreso = fila.FechaIngreso.ToString("yyyy-MM-dd"),
        Descripcion = fila.Descripcion,
        Rama = fila.Rama,
        Estado = fila.Estado,
        EstadoColor = fila.EstadoColor,
        Juzgado = fila.Juzgado,
        UltimaActuacion = fila.UltimaActuacion,
        FechaUltimaActuacion = fila.FechaUltimaActuacion?.ToString("yyyy-MM-dd")
    };
}

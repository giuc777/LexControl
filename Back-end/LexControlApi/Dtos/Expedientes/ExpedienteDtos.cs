using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Expedientes;

// ── Filas de mapeo Dapper ──────────────────────────────────────

/// <summary>Fila devuelta por SP_Expediente_ListarPaginado.</summary>
public class ExpedienteFila
{
    public int ID { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public int Cliente_ID { get; set; }
    public int RolProcesalId { get; set; }
    public string RolProcesal { get; set; } = string.Empty;
    public int RamaId { get; set; }
    public string Rama { get; set; } = string.Empty;
    public string? RamaColor { get; set; }
    public string? TipoProceso { get; set; }
    public int JuzgadoId { get; set; }
    public string Juzgado { get; set; } = string.Empty;
    public DateTime FechaIngreso { get; set; }
    public int EstadoId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Descripcion { get; set; }
    public string? NotasInternas { get; set; }
    public DateTime? FechaCierre { get; set; }
    public int AbogadoId { get; set; }
    public string Abogado { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public int TotalRegistros { get; set; }
}

/// <summary>Fila devuelta por SP_Expediente_ObtenerPorID.</summary>
public class ExpedienteDetalleFila
{
    public int ID { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public int Cliente_ID { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public int Rol_Procesal_ID { get; set; }
    public string RolProcesal { get; set; } = string.Empty;
    public int Rama_ID { get; set; }
    public string RamaNombre { get; set; } = string.Empty;
    public string? RamaColor { get; set; }
    public string? TipoProceso { get; set; }
    public int Juzgado_ID { get; set; }
    public string JuzgadoNombre { get; set; } = string.Empty;
    public DateTime FechaIngreso { get; set; }
    public int Estado_ID { get; set; }
    public string EstadoNombre { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Descripcion { get; set; }
    public string? NotasInternas { get; set; }
    public DateTime? FechaCierre { get; set; }
    public int Usuario_ID { get; set; }
    public string AbogadoNombre { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaModificacion { get; set; }
}

// ── Filas de sub-entidades ─────────────────────────────────────

/// <summary>Fila de parte procesal.</summary>
public class ParteProcesalFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? DPI { get; set; }
    public string? Telefono { get; set; }
    public string? AbogadoDefensor { get; set; }
    public string? Rol { get; set; }
    public string? Descripcion { get; set; }
    public bool Activo { get; set; }
    public DateTime FechaCreacion { get; set; }
}

/// <summary>Fila de nota de expediente.</summary>
public class NotaExpedienteFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string Contenido { get; set; } = string.Empty;
    public int? Etiqueta_ID { get; set; }
    public string? EtiquetaNombre { get; set; }
    public string? EtiquetaColor { get; set; }
    public bool Fijado { get; set; }
    public bool Prioritario { get; set; }
    public int Usuario_ID { get; set; }
    public string? UsuarioNombre { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaModificacion { get; set; }
}

/// <summary>Fila de documento de expediente.</summary>
public class DocExpedienteFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public string TipoArchivo { get; set; } = string.Empty;
    public long? Tamano { get; set; }
    public string? Descripcion { get; set; }
    public int Usuario_ID { get; set; }
    public string? UsuarioNombre { get; set; }
    public DateTime FechaSubida { get; set; }
}

// ── DTOs de salida ─────────────────────────────────────────────

/// <summary>Expediente para el listado (frontend).</summary>
public class ExpedienteDto
{
    public int Id { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public int RolProcesalId { get; set; }
    public string RolProcesal { get; set; } = string.Empty;
    public int RamaId { get; set; }
    public string Rama { get; set; } = string.Empty;
    public string? RamaColor { get; set; }
    public string? TipoProceso { get; set; }
    public int JuzgadoId { get; set; }
    public string Juzgado { get; set; } = string.Empty;
    public string? FechaIngreso { get; set; }
    public int EstadoId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Descripcion { get; set; }
    public string? NotasInternas { get; set; }
    public string? FechaCierre { get; set; }
    public int AbogadoId { get; set; }
    public string Abogado { get; set; } = string.Empty;
    public string? FechaCreacion { get; set; }
    public string? FechaModificacion { get; set; }

    public static ExpedienteDto Desde(ExpedienteFila f) => new()
    {
        Id = f.ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        ClienteId = f.Cliente_ID,
        RolProcesalId = f.RolProcesalId,
        RolProcesal = f.RolProcesal,
        RamaId = f.RamaId,
        Rama = f.Rama,
        RamaColor = f.RamaColor,
        TipoProceso = f.TipoProceso,
        JuzgadoId = f.JuzgadoId,
        Juzgado = f.Juzgado,
        FechaIngreso = f.FechaIngreso.ToString("yyyy-MM-dd"),
        EstadoId = f.EstadoId,
        Estado = f.Estado,
        EstadoColor = f.EstadoColor,
        Descripcion = f.Descripcion,
        NotasInternas = f.NotasInternas,
        FechaCierre = f.FechaCierre?.ToString("yyyy-MM-dd"),
        AbogadoId = f.AbogadoId,
        Abogado = f.Abogado,
        FechaCreacion = f.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss"),
        FechaModificacion = f.FechaModificacion?.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Detalle completo de un expediente.</summary>
public class ExpedienteDetalleDto
{
    public int Id { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public int RolProcesalId { get; set; }
    public string RolProcesal { get; set; } = string.Empty;
    public int RamaId { get; set; }
    public string RamaNombre { get; set; } = string.Empty;
    public string? RamaColor { get; set; }
    public string? TipoProceso { get; set; }
    public int JuzgadoId { get; set; }
    public string JuzgadoNombre { get; set; } = string.Empty;
    public string? FechaIngreso { get; set; }
    public int EstadoId { get; set; }
    public string EstadoNombre { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Descripcion { get; set; }
    public string? NotasInternas { get; set; }
    public string? FechaCierre { get; set; }
    public int AbogadoId { get; set; }
    public string AbogadoNombre { get; set; } = string.Empty;
    public string? FechaCreacion { get; set; }
    public string? FechaModificacion { get; set; }

    public static ExpedienteDetalleDto Desde(ExpedienteDetalleFila f) => new()
    {
        Id = f.ID,
        NoExpediente = f.NoExpediente,
        ClienteId = f.Cliente_ID,
        ClienteNombre = f.ClienteNombre,
        RolProcesalId = f.Rol_Procesal_ID,
        RolProcesal = f.RolProcesal,
        RamaId = f.Rama_ID,
        RamaNombre = f.RamaNombre,
        RamaColor = f.RamaColor,
        TipoProceso = f.TipoProceso,
        JuzgadoId = f.Juzgado_ID,
        JuzgadoNombre = f.JuzgadoNombre,
        FechaIngreso = f.FechaIngreso.ToString("yyyy-MM-dd"),
        EstadoId = f.Estado_ID,
        EstadoNombre = f.EstadoNombre,
        EstadoColor = f.EstadoColor,
        Descripcion = f.Descripcion,
        NotasInternas = f.NotasInternas,
        FechaCierre = f.FechaCierre?.ToString("yyyy-MM-dd"),
        AbogadoId = f.Usuario_ID,
        AbogadoNombre = f.AbogadoNombre,
        FechaCreacion = f.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss"),
        FechaModificacion = f.FechaModificacion?.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Parte procesal para el frontend.</summary>
public class ParteProcesalDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? DPI { get; set; }
    public string? Telefono { get; set; }
    public string? AbogadoDefensor { get; set; }
    public string? Rol { get; set; }
    public string? Descripcion { get; set; }
    public string? FechaCreacion { get; set; }

    public static ParteProcesalDto Desde(ParteProcesalFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        Tipo = f.Tipo,
        NombreCompleto = f.NombreCompleto,
        DPI = f.DPI,
        Telefono = f.Telefono,
        AbogadoDefensor = f.AbogadoDefensor,
        Rol = f.Rol,
        Descripcion = f.Descripcion,
        FechaCreacion = f.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Nota de expediente para el frontend.</summary>
public class NotaExpedienteDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string Contenido { get; set; } = string.Empty;
    public int? EtiquetaId { get; set; }
    public string? EtiquetaNombre { get; set; }
    public string? EtiquetaColor { get; set; }
    public bool Fijado { get; set; }
    public bool Prioritario { get; set; }
    public int UsuarioId { get; set; }
    public string? UsuarioNombre { get; set; }
    public string? FechaCreacion { get; set; }
    public string? FechaModificacion { get; set; }

    public static NotaExpedienteDto Desde(NotaExpedienteFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        Contenido = f.Contenido,
        EtiquetaId = f.Etiqueta_ID,
        EtiquetaNombre = f.EtiquetaNombre,
        EtiquetaColor = f.EtiquetaColor,
        Fijado = f.Fijado,
        Prioritario = f.Prioritario,
        UsuarioId = f.Usuario_ID,
        UsuarioNombre = f.UsuarioNombre,
        FechaCreacion = f.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss"),
        FechaModificacion = f.FechaModificacion?.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Documento de expediente para el frontend.</summary>
public class DocExpedienteDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public string TipoArchivo { get; set; } = string.Empty;
    public long? Tamano { get; set; }
    public string? Descripcion { get; set; }
    public int UsuarioId { get; set; }
    public string? UsuarioNombre { get; set; }
    public string? FechaSubida { get; set; }

    public static DocExpedienteDto Desde(DocExpedienteFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        NombreArchivo = f.NombreArchivo,
        RutaArchivo = f.RutaArchivo,
        TipoArchivo = f.TipoArchivo,
        Tamano = f.Tamano,
        Descripcion = f.Descripcion,
        UsuarioId = f.Usuario_ID,
        UsuarioNombre = f.UsuarioNombre,
        FechaSubida = f.FechaSubida.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

// ── DTOs de entrada ────────────────────────────────────────────

/// <summary>Datos para crear un expediente.</summary>
public class ExpedienteCrearDto
{
    [Required(ErrorMessage = "El cliente es obligatorio.")]
    public int ClienteId { get; set; }

    [Required(ErrorMessage = "El rol procesal es obligatorio.")]
    public int RolProcesalId { get; set; }

    [Required(ErrorMessage = "El número de expediente es obligatorio.")]
    [MaxLength(50)]
    public string NoExpediente { get; set; } = string.Empty;

    [Required(ErrorMessage = "La rama es obligatoria.")]
    public int RamaId { get; set; }

    [MaxLength(50)]
    public string? TipoProceso { get; set; }

    [Required(ErrorMessage = "El juzgado es obligatorio.")]
    public int JuzgadoId { get; set; }

    public DateTime? FechaIngreso { get; set; }

    [Required(ErrorMessage = "El estado es obligatorio.")]
    public int EstadoId { get; set; }

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [MaxLength(1000)]
    public string? NotasInternas { get; set; }

    [Required(ErrorMessage = "El abogado asignado es obligatorio.")]
    public int AbogadoId { get; set; }
}

/// <summary>Datos para actualizar un expediente.</summary>
public class ExpedienteActualizarDto
{
    public int? ClienteId { get; set; }
    public int? RolProcesalId { get; set; }
    public int? RamaId { get; set; }

    [MaxLength(50)]
    public string? TipoProceso { get; set; }

    public int? JuzgadoId { get; set; }
    public int? EstadoId { get; set; }

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [MaxLength(1000)]
    public string? NotasInternas { get; set; }

    public DateTime? FechaCierre { get; set; }
}

/// <summary>Solicitud de cambio de estado.</summary>
public class ExpedienteEstadoDto
{
    [Required]
    public int NuevoEstadoId { get; set; }

    public DateTime? FechaCierre { get; set; }
}

/// <summary>Datos para crear una parte procesal.</summary>
public class ParteProcesalCrearDto
{
    [Required(ErrorMessage = "El tipo es obligatorio.")]
    [MaxLength(20)]
    public string Tipo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre completo es obligatorio.")]
    [MaxLength(100)]
    public string NombreCompleto { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? DPI { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(100)]
    public string? AbogadoDefensor { get; set; }

    [MaxLength(50)]
    public string? Rol { get; set; }

    [MaxLength(200)]
    public string? Descripcion { get; set; }
}

/// <summary>Datos para actualizar una parte procesal.</summary>
public class ParteProcesalActualizarDto
{
    [MaxLength(20)]
    public string? Tipo { get; set; }

    [MaxLength(100)]
    public string? NombreCompleto { get; set; }

    [MaxLength(20)]
    public string? DPI { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(100)]
    public string? AbogadoDefensor { get; set; }

    [MaxLength(50)]
    public string? Rol { get; set; }

    [MaxLength(200)]
    public string? Descripcion { get; set; }
}

/// <summary>Datos para crear una nota.</summary>
public class NotaExpedienteCrearDto
{
    [Required(ErrorMessage = "El contenido es obligatorio.")]
    public string Contenido { get; set; } = string.Empty;

    public int? EtiquetaId { get; set; }
    public bool Fijado { get; set; }
    public bool Prioritario { get; set; }
}

/// <summary>Datos para actualizar una nota.</summary>
public class NotaExpedienteActualizarDto
{
    public string? Contenido { get; set; }
    public int? EtiquetaId { get; set; }
    public bool? Fijado { get; set; }
    public bool? Prioritario { get; set; }
}

/// <summary>Datos para registrar un documento.</summary>
public class DocExpedienteCrearDto
{
    [Required(ErrorMessage = "El nombre del archivo es obligatorio.")]
    [MaxLength(200)]
    public string NombreArchivo { get; set; } = string.Empty;

    [Required(ErrorMessage = "La ruta del archivo es obligatoria.")]
    [MaxLength(500)]
    public string RutaArchivo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El tipo de archivo es obligatorio.")]
    [MaxLength(20)]
    public string TipoArchivo { get; set; } = string.Empty;

    public long? Tamano { get; set; }

    [MaxLength(200)]
    public string? Descripcion { get; set; }
}

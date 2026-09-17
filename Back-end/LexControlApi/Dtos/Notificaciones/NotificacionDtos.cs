using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Notificaciones;

/// <summary>Fila cruda devuelta por SP_Notificacion_Listar (mapeo Dapper).</summary>
public class NotificacionFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? Juzgado { get; set; }
    public DateTime FechaRecepcion { get; set; }
    public DateTime? FechaAtencion { get; set; }
    public string? NumeroResolucion { get; set; }
    public bool EsResolucion { get; set; }
    public bool? Favorable { get; set; }
}

/// <summary>Fila cruda devuelta por SP_Notificacion_ObtenerPorID (mapeo Dapper).</summary>
public class NotificacionDetalleFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public int Juzgado_ID { get; set; }
    public string? Juzgado { get; set; }
    public DateTime FechaRecepcion { get; set; }
    public int Tipo_ID { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string? Contenido { get; set; }
    public string? Resumen { get; set; }
    public int Estado_ID { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? NumeroExpedienteOJ { get; set; }
    public string? PDF_Ruta { get; set; }
    public int? DuplicadoDe_ID { get; set; }
    public string? Notas { get; set; }
    public bool EsResolucion { get; set; }
    public string? NumeroResolucion { get; set; }
    public bool? Favorable { get; set; }
    public DateTime? FechaAtencion { get; set; }
    public DateTime FechaCreacion { get; set; }
}

/// <summary>Notificación expuesta al frontend (listado).</summary>
public class NotificacionDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? Juzgado { get; set; }
    public string FechaRecepcion { get; set; } = string.Empty;
    public string? FechaAtencion { get; set; }
    public string? NumeroResolucion { get; set; }
    public bool EsResolucion { get; set; }
    public bool? Favorable { get; set; }

    public static NotificacionDto Desde(NotificacionFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        Tipo = f.Tipo,
        Estado = f.Estado,
        Juzgado = f.Juzgado,
        FechaRecepcion = f.FechaRecepcion.ToString("yyyy-MM-dd"),
        FechaAtencion = f.FechaAtencion?.ToString("yyyy-MM-dd"),
        NumeroResolucion = f.NumeroResolucion,
        EsResolucion = f.EsResolucion,
        Favorable = f.Favorable
    };
}

/// <summary>Notificación expuesta al frontend (detalle completo).</summary>
public class NotificacionDetalleDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public int JuzgadoId { get; set; }
    public string? Juzgado { get; set; }
    public string FechaRecepcion { get; set; } = string.Empty;
    public int TipoId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string? Contenido { get; set; }
    public string? Resumen { get; set; }
    public int EstadoId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? NumeroExpedienteOJ { get; set; }
    public string? PdfRuta { get; set; }
    public int? DuplicadoDeId { get; set; }
    public string? Notas { get; set; }
    public bool EsResolucion { get; set; }
    public string? NumeroResolucion { get; set; }
    public bool? Favorable { get; set; }
    public string? FechaAtencion { get; set; }
    public string FechaCreacion { get; set; } = string.Empty;

    public static NotificacionDetalleDto Desde(NotificacionDetalleFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        JuzgadoId = f.Juzgado_ID,
        Juzgado = f.Juzgado,
        FechaRecepcion = f.FechaRecepcion.ToString("yyyy-MM-dd"),
        TipoId = f.Tipo_ID,
        Tipo = f.Tipo,
        Contenido = f.Contenido,
        Resumen = f.Resumen,
        EstadoId = f.Estado_ID,
        Estado = f.Estado,
        NumeroExpedienteOJ = f.NumeroExpedienteOJ,
        PdfRuta = f.PDF_Ruta,
        DuplicadoDeId = f.DuplicadoDe_ID,
        Notas = f.Notas,
        EsResolucion = f.EsResolucion,
        NumeroResolucion = f.NumeroResolucion,
        Favorable = f.Favorable,
        FechaAtencion = f.FechaAtencion?.ToString("yyyy-MM-dd"),
        FechaCreacion = f.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Datos de entrada para crear una notificación.</summary>
public class NotificacionCrearDto
{
    [Required(ErrorMessage = "El expediente es obligatorio.")]
    public int ExpedienteId { get; set; }
    [Required(ErrorMessage = "El juzgado es obligatorio.")]
    public int JuzgadoId { get; set; }
    [Required(ErrorMessage = "La fecha de recepción es obligatoria.")]
    public DateTime FechaRecepcion { get; set; }
    [Required(ErrorMessage = "El tipo es obligatorio.")]
    public int TipoId { get; set; }
    [MaxLength(2000)]
    public string? Contenido { get; set; }
    [MaxLength(500)]
    public string? Resumen { get; set; }
    [Required(ErrorMessage = "El estado es obligatorio.")]
    public int EstadoId { get; set; }
    [MaxLength(100)]
    public string? NumeroExpedienteOJ { get; set; }
    [MaxLength(500)]
    public string? PdfRuta { get; set; }
    public int? DuplicadoDeId { get; set; }
    [MaxLength(500)]
    public string? Notas { get; set; }
    public bool EsResolucion { get; set; }
    [MaxLength(100)]
    public string? NumeroResolucion { get; set; }
    public bool? Favorable { get; set; }
}

/// <summary>Datos de entrada para actualizar una notificación.</summary>
public class NotificacionActualizarDto
{
    public int? JuzgadoId { get; set; }
    public DateTime? FechaRecepcion { get; set; }
    public int? TipoId { get; set; }
    [MaxLength(2000)]
    public string? Contenido { get; set; }
    [MaxLength(500)]
    public string? Resumen { get; set; }
    public int? EstadoId { get; set; }
    [MaxLength(100)]
    public string? NumeroExpedienteOJ { get; set; }
    [MaxLength(500)]
    public string? PdfRuta { get; set; }
    [MaxLength(500)]
    public string? Notas { get; set; }
    public bool? EsResolucion { get; set; }
    [MaxLength(100)]
    public string? NumeroResolucion { get; set; }
    public bool? Favorable { get; set; }
}

/// <summary>Datos de entrada para atender una notificación.</summary>
public class NotificacionAtenderDto
{
    [MaxLength(500)]
    public string? Notas { get; set; }
}

/// <summary>Datos de entrada para verificar duplicados de una notificación.</summary>
public class DuplicadoVerificarDto
{
    [Required(ErrorMessage = "El expediente es obligatorio.")]
    public int ExpedienteId { get; set; }
    [MaxLength(100)]
    public string? NumeroResolucion { get; set; }
    [MaxLength(100)]
    public string? NumeroExpedienteOJ { get; set; }
}

/// <summary>Fila cruda devuelta por SP_NotificacionOJ_VerificarDuplicado.</summary>
public class DuplicadoFila
{
    public int ID { get; set; }
    public string? Resumen { get; set; }
    public DateTime FechaRecepcion { get; set; }
}

/// <summary>Duplicado expuesto al frontend.</summary>
public class DuplicadoDto
{
    public int Id { get; set; }
    public string? Resumen { get; set; }
    public string FechaRecepcion { get; set; } = string.Empty;

    public static DuplicadoDto Desde(DuplicadoFila f) => new()
    {
        Id = f.ID,
        Resumen = f.Resumen,
        FechaRecepcion = f.FechaRecepcion.ToString("yyyy-MM-dd")
    };
}

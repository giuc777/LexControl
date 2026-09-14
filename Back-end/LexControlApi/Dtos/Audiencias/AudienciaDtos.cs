using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Audiencias;

/// <summary>Fila cruda devuelta por SP_Audiencia_Listar (mapeo Dapper).</summary>
public class AudienciaFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public DateTime Fecha { get; set; }
    public string HoraInicio { get; set; } = string.Empty;
    public string? HoraFin { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Juzgado { get; set; } = string.Empty;
    public string? Sala { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Resultado { get; set; }
}

/// <summary>Fila cruda devuelta por SP_Audiencia_ObtenerPorID (mapeo Dapper).</summary>
public class AudienciaDetalleFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public DateTime Fecha { get; set; }
    public string HoraInicio { get; set; } = string.Empty;
    public string? HoraFin { get; set; }
    public int Tipo_ID { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public int Juzgado_ID { get; set; }
    public string Juzgado { get; set; } = string.Empty;
    public string? Sala { get; set; }
    public int Estado_ID { get; set; }
    public string Estado { get; set; } = string.Empty;
    public int? Resultado_ID { get; set; }
    public string? Resultado { get; set; }
    public string? DescripcionResultado { get; set; }
    public string? ProximaActuacion { get; set; }
    public string? Notas { get; set; }
    public string? Documentos { get; set; }
    public int Usuario_Creacion_ID { get; set; }
    public string? UsuarioCreacionNombre { get; set; }
    public DateTime FechaCreacion { get; set; }
}

/// <summary>Fila cruda devuelta por SP_Audiencia_Proximas (mapeo Dapper).</summary>
public class AudienciaProximaFila
{
    public int ID { get; set; }
    public DateTime Fecha { get; set; }
    public string HoraInicio { get; set; } = string.Empty;
    public string NoExpediente { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Juzgado { get; set; } = string.Empty;
    public string? Sala { get; set; }
    public string Estado { get; set; } = string.Empty;
}

/// <summary>Audiencia expuesta al frontend (listado y proximas).</summary>
public class AudienciaDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string HoraInicio { get; set; } = string.Empty;
    public string? HoraFin { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Juzgado { get; set; } = string.Empty;
    public string? Sala { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Resultado { get; set; }

    public static AudienciaDto Desde(AudienciaFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        Fecha = f.Fecha.ToString("yyyy-MM-dd"),
        HoraInicio = f.HoraInicio,
        HoraFin = f.HoraFin,
        Tipo = f.Tipo,
        Juzgado = f.Juzgado,
        Sala = f.Sala,
        Estado = f.Estado,
        Resultado = f.Resultado
    };

    public static AudienciaDto DesdeProxima(AudienciaProximaFila f) => new()
    {
        Id = f.ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        Fecha = f.Fecha.ToString("yyyy-MM-dd"),
        HoraInicio = f.HoraInicio,
        Tipo = f.Tipo,
        Juzgado = f.Juzgado,
        Sala = f.Sala,
        Estado = f.Estado
    };
}

/// <summary>Audiencia expuesta al frontend (detalle completo).</summary>
public class AudienciaDetalleDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string HoraInicio { get; set; } = string.Empty;
    public string? HoraFin { get; set; }
    public int TipoId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public int JuzgadoId { get; set; }
    public string Juzgado { get; set; } = string.Empty;
    public string? Sala { get; set; }
    public int EstadoId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public int? ResultadoId { get; set; }
    public string? Resultado { get; set; }
    public string? DescripcionResultado { get; set; }
    public string? ProximaActuacion { get; set; }
    public string? Notas { get; set; }
    public string? Documentos { get; set; }
    public string? UsuarioCreacion { get; set; }
    public string? FechaCreacion { get; set; }

    public static AudienciaDetalleDto Desde(AudienciaDetalleFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        Fecha = f.Fecha.ToString("yyyy-MM-dd"),
        HoraInicio = f.HoraInicio,
        HoraFin = f.HoraFin,
        TipoId = f.Tipo_ID,
        Tipo = f.Tipo,
        JuzgadoId = f.Juzgado_ID,
        Juzgado = f.Juzgado,
        Sala = f.Sala,
        EstadoId = f.Estado_ID,
        Estado = f.Estado,
        ResultadoId = f.Resultado_ID,
        Resultado = f.Resultado,
        DescripcionResultado = f.DescripcionResultado,
        ProximaActuacion = f.ProximaActuacion,
        Notas = f.Notas,
        Documentos = f.Documentos,
        UsuarioCreacion = f.UsuarioCreacionNombre,
        FechaCreacion = f.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Datos de entrada para crear una audiencia.</summary>
public class AudienciaCrearDto
{
    [Required(ErrorMessage = "El expediente es obligatorio.")]
    public int ExpedienteId { get; set; }

    [Required(ErrorMessage = "El tipo de audiencia es obligatorio.")]
    public int TipoId { get; set; }

    [Required(ErrorMessage = "La fecha es obligatoria.")]
    public DateTime Fecha { get; set; }

    [Required(ErrorMessage = "La hora de inicio es obligatoria.")]
    public string HoraInicio { get; set; } = string.Empty;

    public string? HoraFin { get; set; }

    [Required(ErrorMessage = "El juzgado es obligatorio.")]
    public int JuzgadoId { get; set; }

    [MaxLength(50)]
    public string? Sala { get; set; }

    [Required(ErrorMessage = "El estado es obligatorio.")]
    public int EstadoId { get; set; }

    [MaxLength(1000)]
    public string? DescripcionResultado { get; set; }

    [MaxLength(200)]
    public string? ProximaActuacion { get; set; }

    [MaxLength(500)]
    public string? Notas { get; set; }

    [MaxLength(500)]
    public string? Documentos { get; set; }
}

/// <summary>Datos de entrada para registrar resultado de una audiencia.</summary>
public class AudienciaResultadoDto
{
    [Required(ErrorMessage = "El resultado es obligatorio.")]
    public int ResultadoId { get; set; }

    [Required(ErrorMessage = "La descripción del resultado es obligatoria.")]
    [MaxLength(1000)]
    public string DescripcionResultado { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ProximaActuacion { get; set; }
}

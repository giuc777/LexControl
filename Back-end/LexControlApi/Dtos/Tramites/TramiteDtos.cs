using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Tramites;

/// <summary>Fila cruda devuelta por SP_Tramite_Listar (mapeo Dapper).</summary>
public class TramiteFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Institucion { get; set; } = string.Empty;
    public DateTime FechaIngreso { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? OficioReferencia { get; set; }
}

/// <summary>Fila cruda devuelta por SP_Tramite_ObtenerPorID (mapeo Dapper).</summary>
public class TramiteDetalleFila
{
    public int ID { get; set; }
    public int Expediente_ID { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public int Tipo_ID { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Institucion { get; set; } = string.Empty;
    public DateTime FechaIngreso { get; set; }
    public int Estado_ID { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? OficioReferencia { get; set; }
    public string? NotasInternas { get; set; }
    public string? DocumentosAdjuntos { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public string? ResumenResolucion { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaUltimaActualizacion { get; set; }
}

/// <summary>Trámite expuesta al frontend (listado).</summary>
public class TramiteDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Institucion { get; set; } = string.Empty;
    public string FechaIngreso { get; set; } = string.Empty;
    public string? FechaResolucion { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? OficioReferencia { get; set; }

    public static TramiteDto Desde(TramiteFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        Tipo = f.Tipo,
        Institucion = f.Institucion,
        FechaIngreso = f.FechaIngreso.ToString("yyyy-MM-dd"),
        FechaResolucion = f.FechaResolucion?.ToString("yyyy-MM-dd"),
        Estado = f.Estado,
        OficioReferencia = f.OficioReferencia
    };
}

/// <summary>Trámite expuesta al frontend (detalle completo).</summary>
public class TramiteDetalleDto
{
    public int Id { get; set; }
    public int ExpedienteId { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public int TipoId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Institucion { get; set; } = string.Empty;
    public string FechaIngreso { get; set; } = string.Empty;
    public int EstadoId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? OficioReferencia { get; set; }
    public string? NotasInternas { get; set; }
    public string? DocumentosAdjuntos { get; set; }
    public string? FechaResolucion { get; set; }
    public string? ResumenResolucion { get; set; }
    public string FechaCreacion { get; set; } = string.Empty;
    public string? FechaUltimaActualizacion { get; set; }

    public static TramiteDetalleDto Desde(TramiteDetalleFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        TipoId = f.Tipo_ID,
        Tipo = f.Tipo,
        Institucion = f.Institucion,
        FechaIngreso = f.FechaIngreso.ToString("yyyy-MM-dd"),
        EstadoId = f.Estado_ID,
        Estado = f.Estado,
        Descripcion = f.Descripcion,
        OficioReferencia = f.OficioReferencia,
        NotasInternas = f.NotasInternas,
        DocumentosAdjuntos = f.DocumentosAdjuntos,
        FechaResolucion = f.FechaResolucion?.ToString("yyyy-MM-dd"),
        ResumenResolucion = f.ResumenResolucion,
        FechaCreacion = f.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss"),
        FechaUltimaActualizacion = f.FechaUltimaActualizacion?.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Datos de entrada para crear un trámite.</summary>
public class TramiteCrearDto
{
    [Required(ErrorMessage = "El expediente es obligatorio.")]
    public int ExpedienteId { get; set; }

    [Required(ErrorMessage = "El tipo de trámite es obligatorio.")]
    public int TipoId { get; set; }

    [Required(ErrorMessage = "La institución es obligatoria.")]
    [MaxLength(100)]
    public string Institucion { get; set; } = string.Empty;

    public DateTime? FechaIngreso { get; set; }

    [Required(ErrorMessage = "El estado es obligatorio.")]
    public int EstadoId { get; set; }

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [MaxLength(50)]
    public string? OficioReferencia { get; set; }

    [MaxLength(500)]
    public string? NotasInternas { get; set; }

    [MaxLength(500)]
    public string? DocumentosAdjuntos { get; set; }
}

/// <summary>Datos de entrada para actualizar el estado de un trámite.</summary>
public class TramiteActualizarEstadoDto
{
    [Required(ErrorMessage = "El estado es obligatorio.")]
    public int EstadoId { get; set; }

    public DateTime? FechaResolucion { get; set; }

    [MaxLength(500)]
    public string? ResumenResolucion { get; set; }
}

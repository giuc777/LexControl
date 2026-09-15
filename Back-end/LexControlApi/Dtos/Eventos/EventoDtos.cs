using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Eventos;

/// <summary>Fila cruda devuelta por SP_Evento_ObtenerDelDia (mapeo Dapper).</summary>
public class EventoFila
{
    public int ID { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public TimeSpan HoraInicio { get; set; }
    public TimeSpan? HoraFin { get; set; }
    public string TipoEvento { get; set; } = string.Empty;
    public string? Ubicacion { get; set; }
    public int Prioridad { get; set; }
    public string? ColorEvento { get; set; }
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? TipoAudiencia { get; set; }
    public string? TipoPlazo { get; set; }
    public string? TipoDiligencia { get; set; }
    public string EstadoNombre { get; set; } = string.Empty;
    public string? Asistentes { get; set; }
}

/// <summary>Evento expuesto al frontend.</summary>
public class EventoDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public string HoraInicio { get; set; } = string.Empty;
    public string? HoraFin { get; set; }
    public string TipoEvento { get; set; } = string.Empty;
    public string? Ubicacion { get; set; }
    public int Prioridad { get; set; }
    public string? ColorEvento { get; set; }
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? TipoAudiencia { get; set; }
    public string? TipoPlazo { get; set; }
    public string? TipoDiligencia { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Asistentes { get; set; }

    public static EventoDto Desde(EventoFila f) => new()
    {
        Id = f.ID,
        Titulo = f.Titulo,
        Fecha = f.Fecha.ToString("yyyy-MM-dd"),
        HoraInicio = f.HoraInicio.ToString(@"hh\:mm"),
        HoraFin = f.HoraFin?.ToString(@"hh\:mm"),
        TipoEvento = f.TipoEvento,
        Ubicacion = f.Ubicacion,
        Prioridad = f.Prioridad,
        ColorEvento = f.ColorEvento,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        TipoAudiencia = f.TipoAudiencia,
        TipoPlazo = f.TipoPlazo,
        TipoDiligencia = f.TipoDiligencia,
        Estado = f.EstadoNombre,
        Asistentes = f.Asistentes
    };
}

/// <summary>Datos de entrada para crear un evento genérico.</summary>
public class EventoCrearDto
{
    [Required(ErrorMessage = "El título es obligatorio.")]
    [MaxLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "La fecha es obligatoria.")]
    public DateTime Fecha { get; set; }

    [Required(ErrorMessage = "La hora de inicio es obligatoria.")]
    public string HoraInicio { get; set; } = string.Empty;

    public string? HoraFin { get; set; }

    public bool DiaCompleto { get; set; }

    [MaxLength(200)]
    public string? Ubicacion { get; set; }

    public int? ExpedienteId { get; set; }

    public int? ClienteId { get; set; }

    public int Prioridad { get; set; }

    [MaxLength(7)]
    public string? ColorEvento { get; set; }

    [Required(ErrorMessage = "El estado es obligatorio.")]
    public int EstadoId { get; set; }

    [Required(ErrorMessage = "El tipo de evento es obligatorio.")]
    [MaxLength(20)]
    public string TipoEvento { get; set; } = string.Empty;

    public bool EsInterno { get; set; }
}

/// <summary>Datos de entrada para crear un evento de tipo audiencia.</summary>
public class EventoAudienciaCrearDto
{
    [Required(ErrorMessage = "El título es obligatorio.")]
    [MaxLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "La fecha es obligatoria.")]
    public DateTime Fecha { get; set; }

    [Required(ErrorMessage = "La hora de inicio es obligatoria.")]
    public string HoraInicio { get; set; } = string.Empty;

    public string? HoraFin { get; set; }

    [MaxLength(200)]
    public string? Ubicacion { get; set; }

    public int? ExpedienteId { get; set; }

    public int? ClienteId { get; set; }

    public int Prioridad { get; set; }

    [MaxLength(7)]
    public string? ColorEvento { get; set; }

    [Required(ErrorMessage = "El estado es obligatorio.")]
    public int EstadoId { get; set; }

    public bool EsInterno { get; set; }

    [Required(ErrorMessage = "El tipo de audiencia es obligatorio.")]
    [MaxLength(30)]
    public string TipoAudiencia { get; set; } = string.Empty;

    public int? JuzgadoId { get; set; }

    public int? SecretarioId { get; set; }

    [MaxLength(50)]
    public string? NumeroExpedienteJudicial { get; set; }

    public string? Resolucion { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Diligencias;

/// <summary>Fila cruda devuelta por SP_Diligencia_Listar (mapeo Dapper).</summary>
public class DiligenciaFila
{
    public int ID { get; set; }
    public int? Expediente_ID { get; set; }
    public string? NoExpediente { get; set; }
    public int? Cliente_ID { get; set; }
    public string? Cliente { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public TimeSpan? HoraInicio { get; set; }
    public bool DiaCompleto { get; set; }
    public string? Ubicacion { get; set; }
    public string? Oficina { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? TiempoDedicado { get; set; }
    public int? RecordatorioMinutos { get; set; }
    public int Usuario_ID { get; set; }
    public string? Abogado { get; set; }
    public DateTime FechaCreacion { get; set; }
}

/// <summary>Fila cruda devuelta por SP_Diligencia_ObtenerPorID (mapeo Dapper).</summary>
public class DiligenciaDetalleFila
{
    public int ID { get; set; }
    public int? Expediente_ID { get; set; }
    public string? NoExpediente { get; set; }
    public int? Cliente_ID { get; set; }
    public string? Cliente { get; set; }
    public int Tipo_ID { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string? TipoColor { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime Fecha { get; set; }
    public TimeSpan? HoraInicio { get; set; }
    public bool DiaCompleto { get; set; }
    public string? Ubicacion { get; set; }
    public string? Oficina { get; set; }
    public int Estado_ID { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Notas { get; set; }
    public string? TiempoDedicado { get; set; }
    public int? RecordatorioMinutos { get; set; }
    public int Usuario_ID { get; set; }
    public string? Abogado { get; set; }
    public DateTime FechaCreacion { get; set; }
}

/// <summary>Diligencia expuesta al frontend (listado).</summary>
public class DiligenciaDto
{
    public int Id { get; set; }
    public int? ExpedienteId { get; set; }
    public string? NoExpediente { get; set; }
    public int? ClienteId { get; set; }
    public string? Cliente { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public string? HoraInicio { get; set; }
    public bool DiaCompleto { get; set; }
    public string? Ubicacion { get; set; }
    public string? Oficina { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? TiempoDedicado { get; set; }
    public string? Abogado { get; set; }

    public static DiligenciaDto Desde(DiligenciaFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        NoExpediente = f.NoExpediente,
        ClienteId = f.Cliente_ID,
        Cliente = f.Cliente,
        Tipo = f.Tipo,
        Titulo = f.Titulo,
        Fecha = f.Fecha.ToString("yyyy-MM-dd"),
        HoraInicio = f.HoraInicio?.ToString(@"hh\:mm"),
        DiaCompleto = f.DiaCompleto,
        Ubicacion = f.Ubicacion,
        Oficina = f.Oficina,
        Estado = f.Estado,
        TiempoDedicado = f.TiempoDedicado,
        Abogado = f.Abogado
    };
}

/// <summary>Diligencia expuesta al frontend (detalle completo).</summary>
public class DiligenciaDetalleDto
{
    public int Id { get; set; }
    public int? ExpedienteId { get; set; }
    public string? NoExpediente { get; set; }
    public int? ClienteId { get; set; }
    public string? Cliente { get; set; }
    public int TipoId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string? TipoColor { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string? HoraInicio { get; set; }
    public bool DiaCompleto { get; set; }
    public string? Ubicacion { get; set; }
    public string? Oficina { get; set; }
    public int EstadoId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Notas { get; set; }
    public string? TiempoDedicado { get; set; }
    public int? RecordatorioMinutos { get; set; }
    public int UsuarioId { get; set; }
    public string? Abogado { get; set; }
    public string FechaCreacion { get; set; } = string.Empty;

    public static DiligenciaDetalleDto Desde(DiligenciaDetalleFila f) => new()
    {
        Id = f.ID,
        ExpedienteId = f.Expediente_ID,
        NoExpediente = f.NoExpediente,
        ClienteId = f.Cliente_ID,
        Cliente = f.Cliente,
        TipoId = f.Tipo_ID,
        Tipo = f.Tipo,
        TipoColor = f.TipoColor,
        Titulo = f.Titulo,
        Descripcion = f.Descripcion,
        Fecha = f.Fecha.ToString("yyyy-MM-dd"),
        HoraInicio = f.HoraInicio?.ToString(@"hh\:mm"),
        DiaCompleto = f.DiaCompleto,
        Ubicacion = f.Ubicacion,
        Oficina = f.Oficina,
        EstadoId = f.Estado_ID,
        Estado = f.Estado,
        EstadoColor = f.EstadoColor,
        Notas = f.Notas,
        TiempoDedicado = f.TiempoDedicado,
        RecordatorioMinutos = f.RecordatorioMinutos,
        UsuarioId = f.Usuario_ID,
        Abogado = f.Abogado,
        FechaCreacion = f.FechaCreacion.ToString("yyyy-MM-ddTHH:mm:ss")
    };
}

/// <summary>Datos de entrada para crear una diligencia.</summary>
public class DiligenciaCrearDto
{
    public int? ExpedienteId { get; set; }

    [Required(ErrorMessage = "El cliente es obligatorio.")]
    public int? ClienteId { get; set; }

    [Required(ErrorMessage = "El tipo de diligencia es obligatorio.")]
    public int TipoId { get; set; }

    [Required(ErrorMessage = "El titulo es obligatorio.")]
    [MaxLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "La fecha es obligatoria.")]
    public DateTime Fecha { get; set; }

    public string? HoraInicio { get; set; }

    public bool DiaCompleto { get; set; }

    [MaxLength(200)]
    public string? Ubicacion { get; set; }

    [MaxLength(100)]
    public string? Oficina { get; set; }

    [Required(ErrorMessage = "El estado es obligatorio.")]
    public int EstadoId { get; set; }

    [MaxLength(500)]
    public string? Notas { get; set; }

    [MaxLength(20)]
    public string? TiempoDedicado { get; set; }

    public int? RecordatorioMinutos { get; set; }
}

/// <summary>Datos de entrada para actualizar una diligencia.</summary>
public class DiligenciaActualizarDto
{
    public int? ExpedienteId { get; set; }

    public int? ClienteId { get; set; }

    public int? TipoId { get; set; }

    [MaxLength(200)]
    public string? Titulo { get; set; }

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    public DateTime? Fecha { get; set; }

    public string? HoraInicio { get; set; }

    public bool? DiaCompleto { get; set; }

    [MaxLength(200)]
    public string? Ubicacion { get; set; }

    [MaxLength(100)]
    public string? Oficina { get; set; }

    public int? EstadoId { get; set; }

    [MaxLength(500)]
    public string? Notas { get; set; }

    [MaxLength(20)]
    public string? TiempoDedicado { get; set; }

    public int? RecordatorioMinutos { get; set; }
}

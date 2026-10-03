using System.ComponentModel.DataAnnotations;

namespace LexControlApi.Dtos.Tramites;

/// <summary>Fila cruda devuelta por SP_NotaTramite_ObtenerPorTramite (mapeo Dapper).</summary>
public class NotaTramiteFila
{
    public int ID { get; set; }
    public int Tramite_ID { get; set; }
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

/// <summary>Nota de trámite para el frontend.</summary>
public class NotaTramiteDto
{
    public int Id { get; set; }
    public int TramiteId { get; set; }
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

    public static NotaTramiteDto Desde(NotaTramiteFila f) => new()
    {
        Id = f.ID,
        TramiteId = f.Tramite_ID,
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

/// <summary>Datos para crear una nota en un trámite.</summary>
public class NotaTramiteCrearDto
{
    [Required(ErrorMessage = "El contenido es obligatorio.")]
    [StringLength(2000, MinimumLength = 1,
        ErrorMessage = "La nota debe tener entre 1 y 2000 caracteres.")]
    public string Contenido { get; set; } = string.Empty;

    public int? EtiquetaId { get; set; }

    public bool Fijado { get; set; }

    public bool Prioritario { get; set; }
}

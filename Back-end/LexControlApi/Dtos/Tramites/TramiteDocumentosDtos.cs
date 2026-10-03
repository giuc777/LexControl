namespace LexControlApi.Dtos.Tramites;

/// <summary>Fila cruda devuelta por los SP_DocTramite_* (mapeo Dapper).</summary>
public class DocTramiteFila
{
    public int ID { get; set; }
    public int Tramite_ID { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public string TipoArchivo { get; set; } = string.Empty;
    public long? Tamano { get; set; }
    public string? Descripcion { get; set; }
    public int Usuario_ID { get; set; }
    public string? UsuarioNombre { get; set; }
    public DateTime FechaSubida { get; set; }
}

/// <summary>Documento adjunto de un trámite para el frontend.</summary>
public class DocTramiteDto
{
    public int Id { get; set; }
    public int TramiteId { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public string TipoArchivo { get; set; } = string.Empty;
    public long? Tamano { get; set; }
    public string? Descripcion { get; set; }
    public int UsuarioId { get; set; }
    public string? UsuarioNombre { get; set; }
    public string? FechaSubida { get; set; }

    public static DocTramiteDto Desde(DocTramiteFila f) => new()
    {
        Id = f.ID,
        TramiteId = f.Tramite_ID,
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

/// <summary>Datos de un archivo ya guardado en disco para registrarlo en el trámite.</summary>
public class DocTramiteCrearDto
{
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public string TipoArchivo { get; set; } = string.Empty;
    public long? Tamano { get; set; }
    public string? Descripcion { get; set; }
}

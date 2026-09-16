namespace LexControlApi.Dtos.Historico;

/// <summary>Fila cruda devuelta por SP_Historico_Listar (mapeo Dapper).</summary>
public class HistoricoFila
{
    public int ID { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public string Rama { get; set; } = string.Empty;
    public string? TipoProceso { get; set; }
    public string? Juzgado { get; set; }
    public DateTime FechaIngreso { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Abogado { get; set; }
    public DateTime? FechaCierre { get; set; }
}

/// <summary>Expediente histórico expuesto al frontend (listado).</summary>
public class HistoricoDto
{
    public int Id { get; set; }
    public string NoExpediente { get; set; } = string.Empty;
    public string? Cliente { get; set; }
    public string Rama { get; set; } = string.Empty;
    public string? TipoProceso { get; set; }
    public string? Juzgado { get; set; }
    public string FechaIngreso { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? EstadoColor { get; set; }
    public string? Abogado { get; set; }
    public string? FechaCierre { get; set; }

    public static HistoricoDto Desde(HistoricoFila f) => new()
    {
        Id = f.ID,
        NoExpediente = f.NoExpediente,
        Cliente = f.Cliente,
        Rama = f.Rama,
        TipoProceso = f.TipoProceso,
        Juzgado = f.Juzgado,
        FechaIngreso = f.FechaIngreso.ToString("yyyy-MM-dd"),
        Estado = f.Estado,
        EstadoColor = f.EstadoColor,
        Abogado = f.Abogado,
        FechaCierre = f.FechaCierre?.ToString("yyyy-MM-dd")
    };
}

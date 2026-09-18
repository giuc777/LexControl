namespace LexControlApi.Dtos.Buscar;

/// <summary>Fila cruda devuelta por SP_Buscar_Global (mapeo Dapper).</summary>
public class BusquedaFila
{
    public string Tipo { get; set; } = string.Empty;
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Subtitulo { get; set; }
    public string Ruta { get; set; } = string.Empty;
}

/// <summary>Item individual de resultado de búsqueda.</summary>
public class BusquedaItemDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Subtitulo { get; set; }
    public string Ruta { get; set; } = string.Empty;
}

/// <summary>Resultado agrupado por tipo de entidad.</summary>
public class BusquedaResultadoDto
{
    public List<BusquedaItemDto> Expedientes { get; set; } = new();
    public List<BusquedaItemDto> Clientes { get; set; } = new();
    public List<BusquedaItemDto> Audiencias { get; set; } = new();
    public List<BusquedaItemDto> Tramites { get; set; } = new();
    public List<BusquedaItemDto> Notificaciones { get; set; } = new();
    public List<BusquedaItemDto> Diligencias { get; set; } = new();
}

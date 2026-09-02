namespace LexControlApi.Dtos.Documentos;

/// <summary>Respuesta del endpoint de upload de archivos.</summary>
public class DocumentoUploadDto
{
    public int Id { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public string TipoArchivo { get; set; } = string.Empty;
    public long Tamano { get; set; }
    public string? Descripcion { get; set; }
    public string? FechaSubida { get; set; }
}

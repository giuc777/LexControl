namespace LexControlApi.Services;

/// <summary>Resultado del guardado de un archivo en el almacenamiento.</summary>
public record ArchivoGuardado(
    string NombreArchivo,
    string RutaArchivo,
    string TipoArchivo,
    long Tamano);

/// <summary>Servicio de almacenamiento de archivos en Cloudinary.</summary>
public interface IFileStorageService
{
    /// <summary>Guarda un archivo en la carpeta del expediente (Cloudinary).</summary>
    Task<ArchivoGuardado> GuardarAsync(IFormFile archivo, int expedienteId, string? descripcion = null);

    /// <summary>
    /// Guarda un archivo en una subcarpeta propia de Cloudinary
    /// (p. ej. "tramites/5"), con las mismas validaciones de magic bytes.
    /// </summary>
    Task<ArchivoGuardado> GuardarEnCarpetaAsync(IFormFile archivo, string subcarpeta, string? descripcion = null);

    /// <summary>Elimina un archivo de Cloudinary por su identificador almacenado.</summary>
    Task<bool> EliminarAsync(string almacenamiento);

    /// <summary>
    /// Genera una URL firmada (con expiración) para descargar o previsualizar el
    /// archivo desde Cloudinary. Devuelve null si el identificador es inválido.
    /// </summary>
    Task<string?> ObtenerUrlAsync(string almacenamiento);
}

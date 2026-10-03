namespace LexControlApi.Services;

/// <summary>Resultado del guardado de un archivo en disco.</summary>
public record ArchivoGuardado(
    string NombreArchivo,
    string RutaArchivo,
    string TipoArchivo,
    long Tamano);

/// <summary>Servicio de almacenamiento de archivos en disco local.</summary>
public interface IFileStorageService
{
    /// <summary>Guarda un archivo en la carpeta del expediente.</summary>
    Task<ArchivoGuardado> GuardarAsync(IFormFile archivo, int expedienteId, string? descripcion = null);

    /// <summary>
    /// Guarda un archivo en una subcarpeta propia del directorio base
    /// (p. ej. "tramites/5"), con las mismas validaciones de magic bytes.
    /// </summary>
    Task<ArchivoGuardado> GuardarEnCarpetaAsync(IFormFile archivo, string subcarpeta, string? descripcion = null);

    /// <summary>Elimina un archivo del disco.</summary>
    Task<bool> EliminarAsync(string rutaRelativa);

    /// <summary>
    /// Resuelve la ruta absoluta de un archivo validando que permanezca
    /// dentro del directorio base (previene path traversal). Devuelve null
    /// si la ruta es inválida o intenta salir del directorio base.
    /// </summary>
    string? ResolverRutaSegura(string rutaRelativa);
}

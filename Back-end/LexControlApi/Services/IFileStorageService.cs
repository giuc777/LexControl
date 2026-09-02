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

    /// <summary>Elimina un archivo del disco.</summary>
    Task<bool> EliminarAsync(string rutaRelativa);

    /// <summary>Obtiene la ruta absoluta de un archivo.</summary>
    string ObtenerRutaAbsoluta(string rutaRelativa);
}

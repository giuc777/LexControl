namespace LexControlApi.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly ILogger<FileStorageService> _logger;

    private static readonly Dictionary<string, string> MimeToExtension = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = ".pdf",
        [".doc"] = ".doc",
        [".docx"] = ".docx",
        [".xls"] = ".xls",
        [".xlsx"] = ".xlsx",
        [".jpg"] = ".jpg",
        [".jpeg"] = ".jpeg",
        [".png"] = ".png",
        [".txt"] = ".txt",
    };

    public FileStorageService(IConfiguration configuracion, ILogger<FileStorageService> logger)
    {
        _logger = logger;
        _basePath = configuracion["FileStorage:BasePath"]
            ?? Path.Combine(AppContext.BaseDirectory, "wwwroot", "documentos");

        if (!Directory.Exists(_basePath))
            Directory.CreateDirectory(_basePath);
    }

    public async Task<ArchivoGuardado> GuardarAsync(IFormFile archivo, int expedienteId, string? descripcion = null)
    {
        var carpeta = Path.Combine(_basePath, expedienteId.ToString());
        Directory.CreateDirectory(carpeta);

        var extension = Path.GetExtension(archivo.FileName);
        if (string.IsNullOrEmpty(extension))
            extension = MimeToExtension.GetValueOrDefault(archivo.ContentType, ".bin");

        var nombreLimpio = LimpiarNombre(Path.GetFileNameWithoutExtension(archivo.FileName));
        var nombreUnico = $"{nombreLimpio}_{DateTime.Now:yyyyMMddHHmmss}{extension}";
        var rutaCompleta = Path.Combine(carpeta, nombreUnico);

        await using var stream = new FileStream(rutaCompleta, FileMode.Create);
        await archivo.CopyToAsync(stream);

        var rutaRelativa = Path.Combine(expedienteId.ToString(), nombreUnico).Replace("\\", "/");

        _logger.LogInformation("Archivo guardado: {Ruta} ({Tamano} bytes)", rutaRelativa, archivo.Length);

        return new ArchivoGuardado(
            NombreArchivo: archivo.FileName,
            RutaArchivo: rutaRelativa,
            TipoArchivo: ObtenerTipoArchivo(extension),
            Tamano: archivo.Length);
    }

    public Task<bool> EliminarAsync(string rutaRelativa)
    {
        var rutaCompleta = Path.Combine(_basePath, rutaRelativa.Replace("/", "\\"));
        if (!File.Exists(rutaCompleta))
            return Task.FromResult(false);

        File.Delete(rutaCompleta);
        _logger.LogInformation("Archivo eliminado: {Ruta}", rutaRelativa);
        return Task.FromResult(true);
    }

    public string ObtenerRutaAbsoluta(string rutaRelativa)
        => Path.Combine(_basePath, rutaRelativa.Replace("/", "\\"));

    private static string LimpiarNombre(string nombre)
    {
        var caracteresInvalidos = Path.GetInvalidFileNameChars();
        return new string(nombre.Where(c => !caracteresInvalidos.Contains(c)).ToArray());
    }

    private static string ObtenerTipoArchivo(string extension) => extension.ToLowerInvariant() switch
    {
        ".pdf" => "PDF",
        ".doc" or ".docx" => "WORD",
        ".xls" or ".xlsx" => "EXCEL",
        ".jpg" or ".jpeg" or ".png" => "IMAGEN",
        _ => "OTRO"
    };
}

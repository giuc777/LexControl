using LexControlApi.Excepciones;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Services;

/// <summary>Validacion de archivos por magic bytes (firmas de archivo).</summary>
internal static class MagicBytes
{
    /// <summary>
    /// Valida que los primeros bytes del archivo coincidan con la extension declarada.
    /// </summary>
    internal static bool Validar(byte[] buffer, int bytesRead, string extension)
    {
        if (bytesRead < 4) return false;

        return extension.ToLowerInvariant() switch
        {
            // PDF: %PDF (25 50 44 46)
            ".pdf" => buffer[0] == 0x25 && buffer[1] == 0x50
                      && buffer[2] == 0x44 && buffer[3] == 0x46,

            // DOC (OLE2 Compound Binary): D0 CF 11 E0
            ".doc" => buffer[0] == 0xD0 && buffer[1] == 0xCF
                      && buffer[2] == 0x11 && buffer[3] == 0xE0,

            // DOCX (ZIP/PK): 50 4B 03 04
            ".docx" => buffer[0] == 0x50 && buffer[1] == 0x4B
                       && buffer[2] == 0x03 && buffer[3] == 0x04,

            // JPEG: FF D8 FF
            ".jpg" or ".jpeg" => bytesRead >= 3
                                 && buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF,

            // PNG: 89 50 4E 47 (‰PNG)
            ".png" => buffer[0] == 0x89 && buffer[1] == 0x50
                      && buffer[2] == 0x4E && buffer[3] == 0x47,

            // TXT: sin magic bytes fiables, se valida solo por extension
            ".txt" => true,

            _ => false
        };
    }
}

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly ILogger<FileStorageService> _logger;

    private static readonly Dictionary<string, string> MimeToExtension = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"]  = ".pdf",
        [".doc"]  = ".doc",
        [".docx"] = ".docx",
        [".jpg"]  = ".jpg",
        [".jpeg"] = ".jpeg",
        [".png"]  = ".png",
        [".txt"]  = ".txt",
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

        byte[] buffer = new byte[8];
        using (var readStream = archivo.OpenReadStream())
        {
            int bytesRead = await readStream.ReadAsync(buffer.AsMemory(0, 8));
            if (!MagicBytes.Validar(buffer, bytesRead, extension))
                throw new ExcepcionNegocio(-1,
                    $"El contenido del archivo no coincide con la extension {extension} indicada.",
                    StatusCodes.Status400BadRequest);
        }

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
        ".pdf"           => "PDF",
        ".doc" or ".docx" => "WORD",
        ".jpg" or ".jpeg" or ".png" => "IMAGEN",
        _                => "OTRO"
    };
}

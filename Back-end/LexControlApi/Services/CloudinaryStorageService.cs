using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using LexControlApi.Excepciones;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace LexControlApi.Services;

/// <summary>
/// Almacenamiento de archivos en Cloudinary. Los archivos se suben a una
/// carpeta propia del proyecto y en la BD se guarda el identificador
/// "{tipo}/{publicId}" (tipo = img o raw). Las URLs de entrega se generan
/// firmadas con expiración, de modo que los documentos no son públicos.
/// </summary>
public class CloudinaryStorageService : IFileStorageService
{
    /// <summary>Segundos de validez de las URLs de descarga firmadas.</summary>
    private const int ExpiracionUrlSegundos = 600;

    private readonly Cloudinary _cloudinary;
    private readonly string _cloudName;
    private readonly string _apiKey;
    private readonly string _apiSecret;
    private readonly string _carpeta;
    private readonly ILogger<CloudinaryStorageService> _logger;

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

    public CloudinaryStorageService(IConfiguration configuracion, ILogger<CloudinaryStorageService> logger)
    {
        _logger = logger;

        _cloudName = configuracion["Cloudinary:CloudName"] ?? string.Empty;
        _apiKey = configuracion["Cloudinary:ApiKey"] ?? string.Empty;
        _apiSecret = configuracion["Cloudinary:ApiSecret"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(_cloudName) || string.IsNullOrWhiteSpace(_apiKey)
            || string.IsNullOrWhiteSpace(_apiSecret))
        {
            throw new InvalidOperationException(
                "Faltan las credenciales de Cloudinary (Cloudinary:CloudName, Cloudinary:ApiKey, " +
                "Cloudinary:ApiSecret). En desarrollo use 'dotnet user-secrets set'; " +
                "en produccion configure variables de entorno.");
        }

        _carpeta = (configuracion["Cloudinary:Carpeta"] ?? "lexcontrol").Trim('/');
        _cloudinary = new Cloudinary(new Account(_cloudName, _apiKey, _apiSecret));
        _cloudinary.Api.Secure = true;

        _logger.LogInformation("Cloudinary configurado (carpeta: {Carpeta})", _carpeta);
    }

    public async Task<ArchivoGuardado> GuardarAsync(IFormFile archivo, int expedienteId, string? descripcion = null)
        => await SubirInternoAsync(archivo, $"expedientes/{expedienteId}");

    public async Task<ArchivoGuardado> GuardarEnCarpetaAsync(IFormFile archivo, string subcarpeta, string? descripcion = null)
    {
        var carpeta = (subcarpeta ?? string.Empty).Replace('\\', '/').Trim('/');
        if (string.IsNullOrWhiteSpace(carpeta) || carpeta.Contains(".."))
            throw new ExcepcionNegocio(-1, "Subcarpeta de almacenamiento invalida.",
                StatusCodes.Status400BadRequest);

        return await SubirInternoAsync(archivo, carpeta);
    }

    private async Task<ArchivoGuardado> SubirInternoAsync(IFormFile archivo, string subcarpeta)
    {
        var extension = Path.GetExtension(archivo.FileName);
        if (string.IsNullOrEmpty(extension))
            extension = MimeToExtension.GetValueOrDefault(archivo.ContentType, ".bin");

        // Validacion de magic bytes (mismo criterio que el almacenamiento local previo).
        byte[] buffer = new byte[8];
        using (var readStream = archivo.OpenReadStream())
        {
            int bytesRead = await readStream.ReadAsync(buffer.AsMemory(0, 8));
            if (!MagicBytes.Validar(buffer, bytesRead, extension))
                throw new ExcepcionNegocio(-1,
                    $"El contenido del archivo no coincide con la extension {extension} indicada.",
                    StatusCodes.Status400BadRequest);
        }

        var esImagen = EsImagen(extension);
        var nombreLimpio = LimpiarNombre(Path.GetFileNameWithoutExtension(archivo.FileName));
        var sufijo = $"{nombreLimpio}_{DateTime.Now:yyyyMMddHHmmss}";

        // En raw la extension forma parte del public_id; en imagen no (Cloudinary guarda el formato aparte).
        var publicIdLocal = esImagen ? sufijo : $"{sufijo}{extension}";

        UploadResult resultado;
        if (esImagen)
        {
            var parametros = new ImageUploadParams
            {
                File = new FileDescription(archivo.FileName, archivo.OpenReadStream()),
                PublicId = publicIdLocal,
                Folder = $"{_carpeta}/{subcarpeta}",
                Overwrite = false,
                UniqueFilename = false
            };
            resultado = await _cloudinary.UploadAsync(parametros);
        }
        else
        {
            var parametros = new RawUploadParams
            {
                File = new FileDescription(archivo.FileName, archivo.OpenReadStream()),
                PublicId = publicIdLocal,
                Folder = $"{_carpeta}/{subcarpeta}",
                Overwrite = false,
                UniqueFilename = false
            };
            resultado = await _cloudinary.UploadAsync(parametros);
        }

        if (resultado.StatusCode != HttpStatusCode.OK)
        {
            _logger.LogError("Cloudinary rechazo la subida: {Codigo} {Mensaje}",
                resultado.StatusCode, resultado.Error?.Message);
            throw new ExcepcionNegocio(-1, "No se pudo almacenar el archivo en Cloudinary.",
                StatusCodes.Status502BadGateway);
        }

        // Identificador persistido en la BD: "img/..." o "raw/..." + public_id con carpeta.
        var tipo = esImagen ? "img" : "raw";
        var almacenamiento = $"{tipo}/{resultado.PublicId}";

        _logger.LogInformation("Archivo subido a Cloudinary: {Almacenamiento} ({Tamano} bytes)",
            almacenamiento, archivo.Length);

        return new ArchivoGuardado(
            NombreArchivo: archivo.FileName,
            RutaArchivo: almacenamiento,
            TipoArchivo: ObtenerTipoArchivo(extension),
            Tamano: archivo.Length);
    }

    public async Task<bool> EliminarAsync(string almacenamiento)
    {
        if (!Descomponer(almacenamiento, out var resourceType, out var publicId))
            return false;

        var resultado = await _cloudinary.DestroyAsync(new DeletionParams(publicId)
        {
            ResourceType = resourceType
        });
        _logger.LogInformation("Eliminacion en Cloudinary: {Almacenamiento} ({Codigo})",
            almacenamiento, resultado.StatusCode);
        return resultado.StatusCode == HttpStatusCode.OK;
    }

    public Task<string?> ObtenerUrlAsync(string almacenamiento)
    {
        if (!Descomponer(almacenamiento, out var resourceType, out var publicId))
            return Task.FromResult<string?>(null);

        // URL de descarga de la API firmada con expiracion (10 min): sin una firma
        // valida y dentro del plazo, Cloudinary no entrega el archivo. A diferencia
        // del CDN, funciona tambien para PDF/ZIP restringidos en Security.
        var tipoRecurso = resourceType == ResourceType.Image ? "image" : "raw";
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var expiracion = timestamp + ExpiracionUrlSegundos;

        var porFirmar = $"expires_at={expiracion}&public_id={publicId}&timestamp={timestamp}&type=upload";
        var firma = CalcularFirma(porFirmar);

        var url = $"https://api.cloudinary.com/v1_1/{_cloudName}/{tipoRecurso}/download" +
            $"?api_key={_apiKey}" +
            $"&expires_at={expiracion}" +
            $"&public_id={Uri.EscapeDataString(publicId)}" +
            $"&timestamp={timestamp}" +
            "&type=upload" +
            $"&signature={firma}";

        return Task.FromResult<string?>(url);
    }

    /// <summary>
    /// Firma SHA-1 en hexadecimal (minusculas) de los parametros ordenados de la
    /// peticion a la API de Cloudinary, segun el algoritmo de firmas v1:
    /// parametros con valores sin codificar + api secret.
    /// </summary>
    private string CalcularFirma(string parametrosOrdenados)
    {
        var datos = Encoding.UTF8.GetBytes(parametrosOrdenados + _apiSecret);
        var hash = SHA1.HashData(datos);
        var sb = new StringBuilder(hash.Length * 2);
        foreach (var b in hash)
            sb.Append(b.ToString("x2"));
        return sb.ToString();
    }

    /// <summary>
    /// Valida el identificador persistido ("img|raw/{publicId}") y extrae su
    /// resource type. Devuelve false si es inválido o intenta salir de la carpeta.
    /// </summary>
    private bool Descomponer(string almacenamiento, out ResourceType resourceType, out string publicId)
    {
        resourceType = ResourceType.Raw;
        publicId = string.Empty;

        if (string.IsNullOrWhiteSpace(almacenamiento))
            return false;

        // Sin "..", sin barra invertida y sin caracteres de control: evita salir
        // de la carpeta. Si se admiten espacios, acentos y simbolos habituales
        // en nombres de archivo (p. ej. "Invitacion Tecnologias Sem. de Proyectos.pdf").
        if (almacenamiento.Contains("..") || almacenamiento.Contains('\\')
            || almacenamiento.Any(char.IsControl))
        {
            _logger.LogWarning("Identificador de almacenamiento invalido: {Almacenamiento}", almacenamiento);
            return false;
        }

        var prefijo = almacenamiento.StartsWith("img/") ? "img"
            : almacenamiento.StartsWith("raw/") ? "raw"
            : null;
        if (prefijo is null)
            return false;

        // Se salta "{prefijo}/" (barra incluida) para quedarse solo con el public_id.
        publicId = almacenamiento[(prefijo.Length + 1)..];
        if (string.IsNullOrWhiteSpace(publicId) || !publicId.StartsWith(_carpeta + "/"))
            return false;

        resourceType = prefijo == "img" ? ResourceType.Image : ResourceType.Raw;
        return true;
    }

    private static bool EsImagen(string extension) =>
        extension.Equals(".jpg", StringComparison.OrdinalIgnoreCase)
        || extension.Equals(".jpeg", StringComparison.OrdinalIgnoreCase)
        || extension.Equals(".png", StringComparison.OrdinalIgnoreCase);

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

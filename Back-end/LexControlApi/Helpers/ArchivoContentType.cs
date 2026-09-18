namespace LexControlApi.Helpers;

/// <summary>Resuelve el Content-Type a partir de la extensión de un archivo.</summary>
public static class ArchivoContentType
{
    public static string Obtener(string ruta) =>
        Path.GetExtension(ruta).ToLowerInvariant() switch
        {
            ".pdf"  => "application/pdf",
            ".doc"  => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"  => "image/png",
            ".txt"  => "text/plain",
            _       => "application/octet-stream"
        };
}
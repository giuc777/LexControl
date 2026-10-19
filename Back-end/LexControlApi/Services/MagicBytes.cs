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

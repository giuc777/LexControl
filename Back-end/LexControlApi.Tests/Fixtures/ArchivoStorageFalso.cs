using LexControlApi.Services;
using Microsoft.AspNetCore.Http;
using System.Collections.Concurrent;

namespace LexControlApi.Tests.Fixtures;

/// <summary>
/// Implementación en memoria de IFileStorageService para pruebas de
/// integración: evita llamadas de red a Cloudinary.
/// </summary>
public class ArchivoStorageFalso : IFileStorageService
{
    // Estático para persistir entre requests (el servicio se registra como scoped).
    private static readonly ConcurrentDictionary<string, byte> Archivos = new();

    public Task<ArchivoGuardado> GuardarAsync(IFormFile archivo, int expedienteId, string? descripcion = null)
        => GuardarInternoAsync(archivo, $"expedientes/{expedienteId}");

    public Task<ArchivoGuardado> GuardarEnCarpetaAsync(IFormFile archivo, string subcarpeta, string? descripcion = null)
        => GuardarInternoAsync(archivo, subcarpeta);

    private static Task<ArchivoGuardado> GuardarInternoAsync(IFormFile archivo, string subcarpeta)
    {
        var almacenamiento = $"raw/pruebas/{subcarpeta}/{archivo.FileName}";
        Archivos.TryAdd(almacenamiento, 0);

        return Task.FromResult(new ArchivoGuardado(
            NombreArchivo: archivo.FileName,
            RutaArchivo: almacenamiento,
            TipoArchivo: "OTRO",
            Tamano: archivo.Length));
    }

    public Task<bool> EliminarAsync(string almacenamiento)
        => Task.FromResult(Archivos.TryRemove(almacenamiento, out _));

    public Task<string?> ObtenerUrlAsync(string almacenamiento)
        => Task.FromResult(Archivos.ContainsKey(almacenamiento)
            ? $"https://storage.test/{almacenamiento}"
            : null);
}

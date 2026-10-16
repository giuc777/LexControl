namespace LexControlApi.Services;

using LexControlApi.Data;
using LexControlApi.Excepciones;
using Microsoft.AspNetCore.Http;

/// <summary>
/// Resuelve campos de catálogo que los formularios permiten capturar como
/// texto libre (select + "Otro (escribir...)") a un ID de fila:
/// si viene el ID se usa tal cual; si viene solo el nombre, se busca por
/// nombre (activo o no) y, si no existe, se crea la fila.
/// La creación ocurre dentro del servicio (SP_*_ResolverPorNombre) para no
/// depender del endpoint de catálogos, que es solo Administrador.
/// </summary>
public interface ICatalogoTextoResolver
{
    /// <summary>
    /// Resuelve un catálogo genérico (RAMA, ROL_PROCESAL, TIPO_AUDIENCIA, ...).
    /// Devuelve null si no hay ni ID ni texto (campo opcional sin valor).
    /// </summary>
    Task<int?> ResolverAsync(string tabla, int? id, string? texto);

    /// <summary>
    /// Resuelve un juzgado por ID o por nombre (lo crea con solo el Nombre
    /// si no existe). Devuelve null si no hay ni ID ni texto.
    /// </summary>
    Task<int?> ResolverJuzgadoAsync(int? id, string? texto);
}

public class CatalogoTextoResolver : ICatalogoTextoResolver
{
    private readonly IRepositorio _repositorio;

    public CatalogoTextoResolver(IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<int?> ResolverAsync(string tabla, int? id, string? texto)
    {
        if (id is > 0)
            return id;

        var nombre = Normalizar(texto, LongitudMaxima(tabla), tabla);
        if (nombre is null)
            return null;

        var resuelto = await _repositorio.ConsultarPrimeroAsync<int?>(
            "SP_Catalogo_ResolverPorNombre",
            new { Tabla = tabla, Nombre = nombre });

        if (resuelto is null or <= 0)
            throw new ExcepcionNegocio(-2,
                $"No se pudo crear el valor \"{nombre}\" en el catálogo {tabla}.",
                StatusCodes.Status400BadRequest);

        return resuelto;
    }

    public async Task<int?> ResolverJuzgadoAsync(int? id, string? texto)
    {
        if (id is > 0)
            return id;

        var nombre = Normalizar(texto, 100, "JUZGADO");
        if (nombre is null)
            return null;

        var resuelto = await _repositorio.ConsultarPrimeroAsync<int?>(
            "SP_Juzgado_ResolverPorNombre",
            new { Nombre = nombre });

        if (resuelto is null or <= 0)
            throw new ExcepcionNegocio(-2,
                $"No se pudo crear el juzgado \"{nombre}\".",
                StatusCodes.Status400BadRequest);

        return resuelto;
    }

    /// <summary>
    /// Longitud máxima de Nombre por tabla (coincide con el esquema:
    /// ROL_PROCESAL es NVARCHAR(30), el resto NVARCHAR(50); JUZGADO NVARCHAR(100)).
    /// </summary>
    private static int LongitudMaxima(string tabla) =>
        tabla.Equals("ROL_PROCESAL", StringComparison.OrdinalIgnoreCase) ? 30 : 50;

    private static string? Normalizar(string? texto, int longitudMaxima, string tabla)
    {
        var nombre = texto?.Trim();
        if (string.IsNullOrEmpty(nombre))
            return null;

        if (nombre.Length > longitudMaxima)
            throw new ExcepcionNegocio(-2,
                $"El valor \"{nombre}\" supera los {longitudMaxima} caracteres permitidos en {tabla}.",
                StatusCodes.Status400BadRequest);

        return nombre;
    }
}

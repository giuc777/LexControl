using LexControlApi.Data;
using LexControlApi.Dtos.Catalogos;
using LexControlApi.Excepciones;

namespace LexControlApi.Services;

/// <summary>Gestión de catálogos del sistema (mantenimiento).</summary>
public interface ICatalogoService
{
    /// <summary>Busca ítems de un catálogo estándar con filtros y paginación.</summary>
    Task<(List<CatalogoDto> Items, int Total)> BuscarCatalogoAsync(
        string tabla, string? busqueda, bool incluirInactivos, int pagina, int tamanoPagina);

    /// <summary>Crea un ítem en un catálogo estándar.</summary>
    Task<CatalogoDto> InsertarCatalogoAsync(string tabla, CatalogoCrearDto datos);

    /// <summary>Actualiza un ítem de catálogo estándar.</summary>
    Task<CatalogoDto> ActualizarCatalogoAsync(string tabla, int id, CatalogoCrearDto datos);

    /// <summary>Activa o desactiva un ítem de catálogo.</summary>
    Task CambiarEstadoCatalogoAsync(string tabla, int id, bool activo);

    /// <summary>Obtiene un ítem de catálogo estándar por ID.</summary>
    Task<CatalogoDto> ObtenerCatalogoPorIdAsync(string tabla, int id);

    // --- Juzgados (tabla con FKs) ---

    /// <summary>Busca juzgados con paginación.</summary>
    Task<(List<JuzgadoDto> Items, int Total)> BuscarJuzgadoAsync(
        string? busqueda, bool incluirInactivos, int pagina, int tamanoPagina);

    /// <summary>Crea un juzgado.</summary>
    Task<JuzgadoDto> InsertarJuzgadoAsync(JuzgadoCrearDto datos);

    /// <summary>Actualiza un juzgado.</summary>
    Task<JuzgadoDto> ActualizarJuzgadoAsync(int id, JuzgadoCrearDto datos);

    /// <summary>Activa o desactiva un juzgado.</summary>
    Task CambiarEstadoJuzgadoAsync(int id, bool activo);

    /// <summary>Obtiene un juzgado por ID.</summary>
    Task<JuzgadoDto> ObtenerJuzgadoPorIdAsync(int id);
}

public class CatalogoService : ICatalogoService
{
    private readonly IRepositorio _repositorio;

    /// <summary>Tablas permitidas para operaciones genéricas.</summary>
    private static readonly HashSet<string> TablasPermitidas = new(StringComparer.OrdinalIgnoreCase)
    {
        "RAMA", "ESTADO_EXPEDIENTE", "TIPO_AUDIENCIA",
        "ESTADO_AUDIENCIA", "RESULTADO_AUDIENCIA",
        "TIPO_TRAMITE", "ESTADO_TRAMITE",
        "TIPO_DILIGENCIA", "ESTADO_DILIGENCIA",
        "TIPO_NOTIFICACION_OJ", "ESTADO_NOTIFICACION_OJ",
        "TIPO_PROCESO", "ETIQUETA_NOTA", "ESTADO_EVENTO",
        "TIPO_JUZGADO", "ROL_PROCESAL"
    };

    public CatalogoService(IRepositorio repositorio) => _repositorio = repositorio;

    // ================================================================
    // Catálogos estándar (genéricos)
    // ================================================================

    public async Task<(List<CatalogoDto> Items, int Total)> BuscarCatalogoAsync(
        string tabla, string? busqueda, bool incluirInactivos, int pagina, int tamanoPagina)
    {
        ValidarTabla(tabla);

        var filas = await _repositorio.ConsultarListaAsync<CatalogoFila>(
            "SP_Catalogo_Buscar",
            new
            {
                Tabla = tabla,
                Busqueda = busqueda,
                IncluirInactivos = incluirInactivos,
                Pagina = pagina,
                TamanoPagina = tamanoPagina
            });

        // El SP devuelve dos result sets: primero el Total, luego los datos.
        // Dapper con ConsultarListaAsync solo captura el segundo result set.
        // El Total se obtiene de la primera fila del segundo set (campo Total del SP).
        var total = filas.FirstOrDefault()?.Total ?? 0;
        var items = filas.Select(CatalogoDto.Desde).ToList();
        return (items, total);
    }

    public async Task<CatalogoDto> InsertarCatalogoAsync(string tabla, CatalogoCrearDto datos)
    {
        ValidarTabla(tabla);

        try
        {
            var retorno = await _repositorio.EjecutarRetornoAsync(
                "SP_Catalogo_Insertar",
                new
                {
                    Tabla = tabla,
                    datos.Nombre,
                    datos.Valor,
                    datos.Descripcion,
                    datos.Color,
                    datos.Orden
                });

            if (retorno != 0)
                throw new ExcepcionNegocio(retorno, MensajeError(retorno, tabla),
                    StatusCodes.Status400BadRequest);
        }
        catch (ExcepcionNegocio)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new ExcepcionNegocio(-1, $"Error al insertar en {tabla}: {ex.Message}",
                StatusCodes.Status500InternalServerError);
        }

        // Obtener el ítem recién creado (el SP no devuelve el ID vía retorno,
        // pero el SP usa SCOPE_IDENTITY y lo retorna como result set).
        // Como el repositorio no lee ese result set, buscamos por nombre.
        var items = await _repositorio.ConsultarListaAsync<CatalogoFila>(
            "SP_Catalogo_Buscar",
            new { Tabla = tabla, Busqueda = datos.Nombre, IncluirInactivos = true, Pagina = 1, TamanoPagina = 50 });

        var fila = items.FirstOrDefault(f =>
            string.Equals(f.Nombre, datos.Nombre, StringComparison.OrdinalIgnoreCase));
        if (fila is null)
            throw new ExcepcionNegocio(-1, "No se pudo obtener el registro creado.",
                StatusCodes.Status500InternalServerError);

        return CatalogoDto.Desde(fila);
    }

    public async Task<CatalogoDto> ActualizarCatalogoAsync(string tabla, int id, CatalogoCrearDto datos)
    {
        ValidarTabla(tabla);

        try
        {
            var retorno = await _repositorio.EjecutarRetornoAsync(
                "SP_Catalogo_Actualizar",
                new
                {
                    Tabla = tabla,
                    ID = id,
                    datos.Nombre,
                    datos.Valor,
                    datos.Descripcion,
                    datos.Color,
                    datos.Orden
                });

            if (retorno != 0)
                throw new ExcepcionNegocio(retorno, MensajeError(retorno, tabla),
                    StatusCodes.Status400BadRequest);
        }
        catch (ExcepcionNegocio)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new ExcepcionNegocio(-1, $"Error al actualizar {tabla}: {ex.Message}",
                StatusCodes.Status500InternalServerError);
        }

        return await ObtenerCatalogoPorIdAsync(tabla, id);
    }

    public async Task CambiarEstadoCatalogoAsync(string tabla, int id, bool activo)
    {
        ValidarTabla(tabla);

        try
        {
            var retorno = await _repositorio.EjecutarRetornoAsync(
                "SP_Catalogo_CambiarEstado",
                new { Tabla = tabla, ID = id, Activo = activo });

            if (retorno != 0)
                throw new ExcepcionNegocio(retorno, MensajeError(retorno, tabla),
                    StatusCodes.Status400BadRequest);
        }
        catch (ExcepcionNegocio)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new ExcepcionNegocio(-1, $"Error al cambiar estado en {tabla}: {ex.Message}",
                StatusCodes.Status500InternalServerError);
        }
    }

    public async Task<CatalogoDto> ObtenerCatalogoPorIdAsync(string tabla, int id)
    {
        ValidarTabla(tabla);

        var fila = await _repositorio.ConsultarPrimeroAsync<CatalogoFila>(
            "SP_Catalogo_ObtenerPorID", new { Tabla = tabla, ID = id });

        if (fila is null)
            throw new ExcepcionNegocio(-1, $"Registro no encontrado en {tabla}.",
                StatusCodes.Status404NotFound);

        return CatalogoDto.Desde(fila);
    }

    // ================================================================
    // Juzgados (tabla con FKs)
    // ================================================================

    public async Task<(List<JuzgadoDto> Items, int Total)> BuscarJuzgadoAsync(
        string? busqueda, bool incluirInactivos, int pagina, int tamanoPagina)
    {
        var filas = await _repositorio.ConsultarListaAsync<JuzgadoFila>(
            "SP_Juzgado_Buscar",
            new
            {
                Busqueda = busqueda,
                IncluirInactivos = incluirInactivos,
                Pagina = pagina,
                TamanoPagina = tamanoPagina
            });

        var total = filas.FirstOrDefault()?.Total ?? 0;
        var items = filas.Select(JuzgadoDto.Desde).ToList();
        return (items, total);
    }

    public async Task<JuzgadoDto> InsertarJuzgadoAsync(JuzgadoCrearDto datos)
    {
        try
        {
            var retorno = await _repositorio.EjecutarRetornoAsync(
                "SP_Juzgado_Insertar",
                new
                {
                    datos.Nombre,
                    TipoJuzgadoID = datos.TipoJuzgadoId,
                    MunicipioID = datos.MunicipioId,
                    datos.Direccion,
                    datos.Telefono,
                    datos.Email
                });

            if (retorno != 0)
                throw new ExcepcionNegocio(retorno, MensajeError(retorno, "JUZGADO"),
                    StatusCodes.Status400BadRequest);
        }
        catch (ExcepcionNegocio)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new ExcepcionNegocio(-1, $"Error al insertar juzgado: {ex.Message}",
                StatusCodes.Status500InternalServerError);
        }

        // Buscar por nombre para obtener el ID
        var items = await _repositorio.ConsultarListaAsync<JuzgadoFila>(
            "SP_Juzgado_Buscar",
            new { Busqueda = datos.Nombre, IncluirInactivos = true, Pagina = 1, TamanoPagina = 50 });

        var fila = items.FirstOrDefault(f =>
            string.Equals(f.Nombre, datos.Nombre, StringComparison.OrdinalIgnoreCase));
        if (fila is null)
            throw new ExcepcionNegocio(-1, "No se pudo obtener el juzgado creado.",
                StatusCodes.Status500InternalServerError);

        return JuzgadoDto.Desde(fila);
    }

    public async Task<JuzgadoDto> ActualizarJuzgadoAsync(int id, JuzgadoCrearDto datos)
    {
        try
        {
            var retorno = await _repositorio.EjecutarRetornoAsync(
                "SP_Juzgado_Actualizar",
                new
                {
                    ID = id,
                    datos.Nombre,
                    TipoJuzgadoID = datos.TipoJuzgadoId,
                    MunicipioID = datos.MunicipioId,
                    datos.Direccion,
                    datos.Telefono,
                    datos.Email
                });

            if (retorno != 0)
                throw new ExcepcionNegocio(retorno, MensajeError(retorno, "JUZGADO"),
                    StatusCodes.Status400BadRequest);
        }
        catch (ExcepcionNegocio)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new ExcepcionNegocio(-1, $"Error al actualizar juzgado: {ex.Message}",
                StatusCodes.Status500InternalServerError);
        }

        return await ObtenerJuzgadoPorIdAsync(id);
    }

    public async Task CambiarEstadoJuzgadoAsync(int id, bool activo)
    {
        try
        {
            var retorno = await _repositorio.EjecutarRetornoAsync(
                "SP_Juzgado_CambiarEstado",
                new { ID = id, Activo = activo });

            if (retorno != 0)
                throw new ExcepcionNegocio(retorno, MensajeError(retorno, "JUZGADO"),
                    StatusCodes.Status400BadRequest);
        }
        catch (ExcepcionNegocio)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new ExcepcionNegocio(-1, $"Error al cambiar estado del juzgado: {ex.Message}",
                StatusCodes.Status500InternalServerError);
        }
    }

    public async Task<JuzgadoDto> ObtenerJuzgadoPorIdAsync(int id)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<JuzgadoFila>(
            "SP_Juzgado_ObtenerPorID", new { ID = id });

        if (fila is null)
            throw new ExcepcionNegocio(-1, "Juzgado no encontrado.",
                StatusCodes.Status404NotFound);

        return JuzgadoDto.Desde(fila);
    }

    // ================================================================
    // Helpers
    // ================================================================

    private static void ValidarTabla(string tabla)
    {
        if (!TablasPermitidas.Contains(tabla))
            throw new ExcepcionNegocio(-1, $"Nombre de tabla no permitido: {tabla}",
                StatusCodes.Status400BadRequest);
    }

    private static string MensajeError(int codigo, string tabla) => codigo switch
    {
        -1 => $"Registro no encontrado en {tabla}.",
        2601 or 2627 => $"Ya existe un registro con ese nombre en {tabla}.",
        _ => $"No se pudo completar la operación en {tabla}. (código {codigo})"
    };
}

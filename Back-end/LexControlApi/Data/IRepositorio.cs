namespace LexControlApi.Data;

using Dapper;
using LexControlApi.Excepciones;
using Microsoft.Data.SqlClient;
using System.Data;

/// <summary>Acceso a datos exclusivamente vía procedimientos almacenados.</summary>
public interface IRepositorio
{
    /// <summary>Ejecuta un SP que devuelve filas y las mapea a T.</summary>
    Task<List<T>> ConsultarListaAsync<T>(string procedimiento, object? parametros = null);

    /// <summary>Ejecuta un SP y devuelve la primera fila o null.</summary>
    Task<T?> ConsultarPrimeroAsync<T>(string procedimiento, object? parametros = null);

    /// <summary>
    /// Ejecuta un SP de acción y devuelve su valor de RETURN sin interpretar
    /// (0 = éxito; negativos = rechazos de negocio; positivos = error SQL).
    /// </summary>
    Task<int> EjecutarRetornoAsync(string procedimiento, object? parametros = null);

    /// <summary>
    /// Ejecuta un SP de acción y devuelve su RETURN junto con el mensaje de
    /// negocio que el SP haya expuesto en su result set (columnas
    /// ErrorNumber/ErrorMessage). Permite mostrar el texto real del SP
    /// (p. ej. "Ya existe un registro con ese nombre") en lugar del código.
    /// </summary>
    Task<(int Retorno, string? Mensaje)> EjecutarRetornoConMensajeAsync(
        string procedimiento, object? parametros = null);

    /// <summary>
    /// Ejecuta un SP de inserción con parámetro OUTPUT del nuevo ID.
    /// Lanza ExcepcionNegocio si el retorno no es 0 o el ID es inválido.
    /// </summary>
    Task<int> InsertarAsync(string procedimiento, object parametros, string parametroNuevoId);

    /// <summary>
    /// Ejecuta un SP que devuelve múltiples conjuntos de resultados.
    /// Devuelve un GridReader de Dapper para leer cada conjunto secuencialmente.
    /// </summary>
    Task<Dapper.SqlMapper.GridReader> ConsultarMultiplesAsync(string procedimiento, object? parametros = null);
}

public class RepositorioSql : IRepositorio
{
    private readonly IConnectionFactory _fabrica;

    public RepositorioSql(IConnectionFactory fabrica) => _fabrica = fabrica;

    public async Task<List<T>> ConsultarListaAsync<T>(string procedimiento, object? parametros = null)
    {
        using var conexion = _fabrica.CrearConexion();
        var dp = CrearParametros(parametros);
        var filas = await conexion.QueryAsync<T>(
            new CommandDefinition(procedimiento, dp, commandType: CommandType.StoredProcedure));
        VerificarRetorno(dp);
        return filas.ToList();
    }

    public async Task<T?> ConsultarPrimeroAsync<T>(string procedimiento, object? parametros = null)
    {
        using var conexion = _fabrica.CrearConexion();
        var dp = CrearParametros(parametros);
        var fila = await conexion.QueryFirstOrDefaultAsync<T>(
            new CommandDefinition(procedimiento, dp, commandType: CommandType.StoredProcedure));
        VerificarRetorno(dp);
        return fila;
    }

    public async Task<int> EjecutarRetornoAsync(string procedimiento, object? parametros = null)
    {
        using var conexion = _fabrica.CrearConexion();
        var dp = CrearParametros(parametros);
        await conexion.ExecuteAsync(
            new CommandDefinition(procedimiento, dp, commandType: CommandType.StoredProcedure));
        return dp.Get<int?>("@RETURN_VALUE") ?? -1;
    }

    /* Fila para leer el result set de error que devuelven los SPs en su CATCH
       (SELECT ERROR_NUMBER() AS ErrorNumber, ERROR_MESSAGE() AS ErrorMessage). */
    private sealed class FilaError
    {
        public int? ErrorNumber { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public async Task<(int Retorno, string? Mensaje)> EjecutarRetornoConMensajeAsync(
        string procedimiento, object? parametros = null)
    {
        using var conexion = _fabrica.CrearConexion();
        var dp = CrearParametros(parametros);

        string? mensaje = null;
        try
        {
            using var grid = await conexion.QueryMultipleAsync(
                new CommandDefinition(procedimiento, dp, commandType: CommandType.StoredProcedure));
            var filas = (await grid.ReadAsync<FilaError>()).ToList();
            mensaje = filas.FirstOrDefault()?.ErrorMessage;
        }
        catch
        {
            // El SP no devolvió un result set legible; se usa el mensaje genérico.
            mensaje = null;
        }

        var retorno = dp.Get<int?>("@RETURN_VALUE") ?? -1;
        return (retorno, mensaje);
    }

    public async Task<int> InsertarAsync(string procedimiento, object parametros, string parametroNuevoId)
    {
        using var conexion = _fabrica.CrearConexion();
        var dp = CrearParametros(parametros);
        dp.Add(parametroNuevoId, dbType: DbType.Int32, direction: ParameterDirection.Output);

        await conexion.ExecuteAsync(
            new CommandDefinition(procedimiento, dp, commandType: CommandType.StoredProcedure));

        var retorno = dp.Get<int?>("@RETURN_VALUE") ?? -1;
        if (retorno != 0)
        {
            var mensaje = retorno switch
            {
                -1 => "No se pudo crear el registro. Verifique que todos los datos sean correctos.",
                547 => "Error de integridad referencial. Verifique que el tipo, estado y cliente existan.",
                2627 or 2601 => "Ya existe un registro con los datos proporcionados.",
                _ => $"No se pudo crear el registro (código de error: {retorno})."
            };
            throw new ExcepcionNegocio(retorno, mensaje,
                StatusCodes.Status500InternalServerError);
        }

        var nuevoId = dp.Get<int?>(parametroNuevoId) ?? -1;
        if (nuevoId <= 0)
            throw new ExcepcionNegocio(-1, "No se pudo obtener el ID del registro creado.",
                StatusCodes.Status500InternalServerError);

        return nuevoId;
    }

    public async Task<SqlMapper.GridReader> ConsultarMultiplesAsync(string procedimiento, object? parametros = null)
    {
        var conexion = _fabrica.CrearConexion();
        var dp = CrearParametros(parametros);
        var grid = await conexion.QueryMultipleAsync(
            new CommandDefinition(procedimiento, dp, commandType: CommandType.StoredProcedure));
        VerificarRetorno(dp);
        return grid;
    }

    private static DynamicParameters CrearParametros(object? parametros)
    {
        var dp = new DynamicParameters(parametros);
        dp.Add("@RETURN_VALUE", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);
        return dp;
    }

    private static void VerificarRetorno(DynamicParameters parametros)
    {
        var retorno = parametros.Get<int?>("@RETURN_VALUE");
        if (retorno is not (null or 0))
            throw new ExcepcionNegocio(retorno.Value, "La operación no pudo completarse en la base de datos.",
                StatusCodes.Status500InternalServerError);
    }
}

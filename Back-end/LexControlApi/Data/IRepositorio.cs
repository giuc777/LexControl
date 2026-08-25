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
    /// Ejecuta un SP de inserción con parámetro OUTPUT del nuevo ID.
    /// Lanza ExcepcionNegocio si el retorno no es 0 o el ID es inválido.
    /// </summary>
    Task<int> InsertarAsync(string procedimiento, object parametros, string parametroNuevoId);
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

    public async Task<int> InsertarAsync(string procedimiento, object parametros, string parametroNuevoId)
    {
        using var conexion = _fabrica.CrearConexion();
        var dp = CrearParametros(parametros);
        dp.Add(parametroNuevoId, dbType: DbType.Int32, direction: ParameterDirection.Output);

        await conexion.ExecuteAsync(
            new CommandDefinition(procedimiento, dp, commandType: CommandType.StoredProcedure));

        var retorno = dp.Get<int?>("@RETURN_VALUE") ?? -1;
        if (retorno != 0)
            throw new ExcepcionNegocio(retorno, "No se pudo crear el registro.",
                StatusCodes.Status500InternalServerError);

        var nuevoId = dp.Get<int?>(parametroNuevoId) ?? -1;
        if (nuevoId <= 0)
            throw new ExcepcionNegocio(-1, "No se pudo crear el registro.",
                StatusCodes.Status500InternalServerError);

        return nuevoId;
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

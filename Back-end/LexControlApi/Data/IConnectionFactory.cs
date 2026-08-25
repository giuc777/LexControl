using LexControlApi.Excepciones;
using Microsoft.Data.SqlClient;

namespace LexControlApi.Data;

/// <summary>Fábrica de conexiones a SQL Server.</summary>
public interface IConnectionFactory
{
    SqlConnection CrearConexion();
}

public class SqlConnectionFactory : IConnectionFactory
{
    private readonly string _cadenaConexion;

    public SqlConnectionFactory(IConfiguration configuracion)
    {
        _cadenaConexion = configuracion.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Falta la cadena de conexión 'DefaultConnection' en appsettings.json.");
    }

    public SqlConnection CrearConexion() => new(_cadenaConexion);
}

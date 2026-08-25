using LexControlApi.Excepciones;
using Microsoft.Data.SqlClient;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LexControlApi.Middleware;

/// <summary>Captura global de errores y respuestas JSON consistentes.</summary>
public class ManejadorExcepciones
{
    private readonly RequestDelegate _siguiente;
    private readonly ILogger<ManejadorExcepciones> _logger;
    private readonly IHostEnvironment _entorno;

    private static readonly JsonSerializerOptions OpcionesJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never
    };

    public ManejadorExcepciones(RequestDelegate siguiente, ILogger<ManejadorExcepciones> logger,
        IHostEnvironment entorno)
    {
        _siguiente = siguiente;
        _logger = logger;
        _entorno = entorno;
    }

    public async Task InvokeAsync(HttpContext contexto)
    {
        try
        {
            await _siguiente(contexto);
        }
        catch (ExcepcionNegocio ex)
        {
            _logger.LogWarning("Error de negocio ({Codigo}): {Mensaje}", ex.Codigo, ex.Message);
            await EscribirRespuestaAsync(contexto, ex.EstatusHttp, ex.Message);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "Error de SQL Server ({Numero})", ex.Number);
            await EscribirRespuestaAsync(contexto,
                StatusCodes.Status500InternalServerError,
                "Error de conexión con la base de datos.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error interno no controlado");
            var detalle = _entorno.IsDevelopment() ? ex.ToString() : null;
            await EscribirRespuestaAsync(contexto,
                StatusCodes.Status500InternalServerError,
                "Error interno del servidor. Consulte los logs.", detalle);
        }
    }

    private static async Task EscribirRespuestaAsync(HttpContext contexto, int estatus, string error,
        string? detalle = null)
    {
        if (contexto.Response.HasStarted) return;

        contexto.Response.Clear();
        contexto.Response.StatusCode = estatus;
        contexto.Response.ContentType = "application/json; charset=utf-8";

        object cuerpo = detalle is null
            ? new { success = false, error }
            : new { success = false, error, detalle };
        await contexto.Response.WriteAsync(JsonSerializer.Serialize(cuerpo, OpcionesJson));
    }
}

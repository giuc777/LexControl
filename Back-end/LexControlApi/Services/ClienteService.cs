using LexControlApi.Dtos.Clientes;
using LexControlApi.Excepciones;

namespace LexControlApi.Services;

/// <summary>Gestión de clientes del bufete.</summary>
public interface IClienteService
{
    Task<(List<ClienteDto> Clientes, int Total)> ListarAsync(
        string? filtroNombre, bool? filtroEstado, string? filtroTipo, int pagina, int tamanioPagina);
    Task<ClienteDetalleDto> ObtenerPorIdAsync(int id);
    Task<ClienteDto> CrearAsync(ClienteCrearDto datos);
    Task<ClienteDto> ActualizarAsync(int id, ClienteActualizarDto datos);
    Task ActivarDesactivarAsync(int id, bool activo);
    Task<EstadisticasClienteDto> ObtenerEstadisticasAsync();
    Task<List<ClienteExpedienteDto>> ObtenerExpedientesAsync(int clienteId);
}

public class ClienteService : IClienteService
{
    private readonly Data.IRepositorio _repositorio;

    public ClienteService(Data.IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<(List<ClienteDto> Clientes, int Total)> ListarAsync(
        string? filtroNombre, bool? filtroEstado, string? filtroTipo, int pagina, int tamanioPagina)
    {
        var filas = await _repositorio.ConsultarListaAsync<ClienteFila>(
            "SP_Cliente_Listar",
            new
            {
                FiltroNombre = filtroNombre,
                FiltroEstado = filtroEstado,
                FiltroTipo = filtroTipo,
                Pagina = pagina,
                TamanioPagina = tamanioPagina
            });

        var total = filas.FirstOrDefault()?.TotalRegistros ?? 0;
        var clientes = filas.Select(ClienteDto.Desde).ToList();
        return (clientes, total);
    }

    public async Task<ClienteDetalleDto> ObtenerPorIdAsync(int id)
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<ClienteDetalleFila>(
            "SP_Cliente_ObtenerPorID", new { ID = id });
        if (fila is null)
            throw new ExcepcionNegocio(-1, "Cliente no encontrado.", StatusCodes.Status404NotFound);
        return ClienteDetalleDto.Desde(fila);
    }

    public async Task<ClienteDto> CrearAsync(ClienteCrearDto datos)
    {
        var parametros = new
        {
            datos.NombreCompleto,
            datos.DPI,
            datos.TelefonoPrincipal,
            datos.EmailPrincipal,
            datos.Direccion,
            datos.TelefonoSecundario,
            datos.EmailSecundario,
            TipoCliente = datos.TipoCliente ?? "Particular",
            datos.Notas,
            UsuarioCreacion_ID = (int?)null
        };

        int nuevoId;
        try
        {
            nuevoId = await _repositorio.InsertarAsync(
                "SP_Cliente_Insertar", parametros, "@NuevoClienteID");
        }
        catch (ExcepcionNegocio ex) when (EsDuplicado(ex.Codigo))
        {
            throw new ExcepcionNegocio(2627, "Ya existe un cliente con esos datos.",
                StatusCodes.Status409Conflict);
        }

        return await ObtenerClienteListadoAsync(nuevoId);
    }

    public async Task<ClienteDto> ActualizarAsync(int id, ClienteActualizarDto datos)
    {
        var retorno = await _repositorio.EjecutarRetornoAsync(
            "SP_Cliente_Actualizar",
            new
            {
                ID = id,
                datos.NombreCompleto,
                datos.DPI,
                datos.TelefonoPrincipal,
                datos.EmailPrincipal,
                datos.TelefonoSecundario,
                datos.EmailSecundario,
                datos.Direccion,
                datos.FechaNacimiento,
                datos.Genero,
                datos.TipoCliente,
                datos.Notas
            });

        VerificarAccion(retorno);

        return await ObtenerClienteListadoAsync(id);
    }

    public async Task ActivarDesactivarAsync(int id, bool activo)
    {
        var nombreSp = activo ? "SP_Cliente_Reactivar" : "SP_Cliente_Desactivar";
        var retorno = await _repositorio.EjecutarRetornoAsync(
            nombreSp, new { ID = id });
        VerificarAccion(retorno);
    }

    public async Task<EstadisticasClienteDto> ObtenerEstadisticasAsync()
    {
        var fila = await _repositorio.ConsultarPrimeroAsync<EstadisticasClienteDto>(
            "SP_Cliente_Estadisticas");
        return fila ?? new EstadisticasClienteDto();
    }

    public async Task<List<ClienteExpedienteDto>> ObtenerExpedientesAsync(int clienteId)
    {
        var filas = await _repositorio.ConsultarListaAsync<ClienteExpedienteFila>(
            "SP_Cliente_ObtenerExpedientes", new { ClienteID = clienteId });
        return filas.Select(ClienteExpedienteDto.Desde).ToList();
    }

    private async Task<ClienteDto> ObtenerClienteListadoAsync(int id)
    {
        // Obtener el cliente recién creado/editado usando SP_Cliente_Listar con filtro por ID
        var filas = await _repositorio.ConsultarListaAsync<ClienteFila>(
            "SP_Cliente_Listar",
            new { FiltroNombre = (string?)null, FiltroEstado = (bool?)null, FiltroTipo = (string?)null, Pagina = 1, TamanioPagina = 1000 });

        var fila = filas.FirstOrDefault(f => f.ClienteID == id);
        if (fila is null)
            throw new ExcepcionNegocio(-1, "Cliente no encontrado.", StatusCodes.Status404NotFound);
        return ClienteDto.Desde(fila);
    }

    private void VerificarAccion(int retorno)
    {
        switch (retorno)
        {
            case 0:
                return;
            case -1:
                throw new ExcepcionNegocio(-1, "Cliente no encontrado.",
                    StatusCodes.Status404NotFound);
            case 2601 or 2627:
                throw new ExcepcionNegocio(2627, "Ya existe un cliente con esos datos.",
                    StatusCodes.Status409Conflict);
            default:
                throw new ExcepcionNegocio(retorno, "No se pudo completar la operación en la base de datos.",
                    StatusCodes.Status500InternalServerError);
        }
    }

    private static bool EsDuplicado(int codigo) => codigo is 2601 or 2627;
}

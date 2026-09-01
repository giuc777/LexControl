using LexControlApi.Dtos.Clientes;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

/// <summary>CRUD de clientes del bufete.</summary>
[ApiController]
[Route("api/clientes")]
[Authorize]
public class ClientesController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public ClientesController(IClienteService clienteService) => _clienteService = clienteService;

    /// <summary>Lista clientes con filtros y paginación.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<ClienteDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<ClienteDto>>>> Listar(
        [FromQuery] string? filtroNombre,
        [FromQuery] bool? filtroEstado,
        [FromQuery] string? filtroTipo,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanioPagina = 20)
    {
        var (clientes, total) = await _clienteService.ListarAsync(
            filtroNombre, filtroEstado, filtroTipo, pagina, tamanioPagina);

        // Agregar el total como header para que el frontend lo lea
        Response.Headers.Append("X-Total-Count", total.ToString());

        return Ok(ApiResponse<List<ClienteDto>>.Correcto(clientes));
    }

    /// <summary>Estadísticas para el bento grid.</summary>
    [HttpGet("estadisticas")]
    [ProducesResponseType(typeof(ApiResponse<EstadisticasClienteDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<EstadisticasClienteDto>>> Estadisticas()
    {
        var stats = await _clienteService.ObtenerEstadisticasAsync();
        return Ok(ApiResponse<EstadisticasClienteDto>.Correcto(stats));
    }

    /// <summary>Obtiene el detalle de un cliente.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ClienteDetalleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ClienteDetalleDto>>> ObtenerPorId(int id)
    {
        var cliente = await _clienteService.ObtenerPorIdAsync(id);
        return Ok(ApiResponse<ClienteDetalleDto>.Correcto(cliente));
    }

    /// <summary>Obtiene los expedientes de un cliente.</summary>
    [HttpGet("{id:int}/expedientes")]
    [ProducesResponseType(typeof(ApiResponse<List<ClienteExpedienteDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<ClienteExpedienteDto>>>> ObtenerExpedientes(int id)
    {
        var expedientes = await _clienteService.ObtenerExpedientesAsync(id);
        return Ok(ApiResponse<List<ClienteExpedienteDto>>.Correcto(expedientes));
    }

    /// <summary>Crea un cliente (Persona + Cliente en transacción).</summary>
    [HttpPost]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<ClienteDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ClienteDto>>> Crear(ClienteCrearDto datos)
    {
        var cliente = await _clienteService.CrearAsync(datos);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = cliente.Id },
            ApiResponse<ClienteDto>.Correcto(cliente));
    }

    /// <summary>Edita un cliente.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(typeof(ApiResponse<ClienteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ClienteDto>>> Actualizar(int id, ClienteActualizarDto datos)
    {
        var cliente = await _clienteService.ActualizarAsync(id, datos);
        return Ok(ApiResponse<ClienteDto>.Correcto(cliente));
    }

    /// <summary>Activa o desactiva un cliente (borrado lógico).</summary>
    [HttpPut("{id:int}/estado")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CambiarEstado(int id, ClienteEstadoDto solicitud)
    {
        await _clienteService.ActivarDesactivarAsync(id, solicitud.Activo);
        return NoContent();
    }
}

/// <summary>Solicitud de cambio de estado del cliente.</summary>
public class ClienteEstadoDto
{
    public bool Activo { get; set; }
}

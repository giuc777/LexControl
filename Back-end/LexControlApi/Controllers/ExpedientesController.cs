using LexControlApi.Dtos.Expedientes;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

/// <summary>CRUD de expedientes del bufete.</summary>
[ApiController]
[Route("api/expedientes")]
[Authorize]
public class ExpedientesController : ControllerBase
{
    private readonly IExpedienteService _expedienteService;

    public ExpedientesController(IExpedienteService expedienteService)
        => _expedienteService = expedienteService;

    // ── Listado paginado ────────────────────────────────────────

    /// <summary>Lista expedientes con filtros y paginación.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<ExpedienteDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<ExpedienteDto>>>> Listar(
        [FromQuery] int? clienteId,
        [FromQuery] int? estadoId,
        [FromQuery] int? ramaId,
        [FromQuery] int? usuarioId,
        [FromQuery] DateTime? fechaInicio,
        [FromQuery] DateTime? fechaFin,
        [FromQuery] string? noExpediente,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanioPagina = 20)
    {
        var (expedientes, total) = await _expedienteService.ListarAsync(
            clienteId, estadoId, ramaId, usuarioId,
            fechaInicio, fechaFin, noExpediente,
            pagina, tamanioPagina);

        Response.Headers.Append("X-Total-Count", total.ToString());
        return Ok(ApiResponse<List<ExpedienteDto>>.Correcto(expedientes));
    }

    // ── Detalle por ID ──────────────────────────────────────────

    /// <summary>Obtiene el detalle de un expediente con todas sus sub-entidades.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ExpedienteDetalleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ExpedienteDetalleDto>>> ObtenerPorId(int id)
    {
        var expediente = await _expedienteService.ObtenerPorIdAsync(id);
        return Ok(ApiResponse<ExpedienteDetalleDto>.Correcto(expediente));
    }

    // ── Crear ───────────────────────────────────────────────────

    /// <summary>Crea un nuevo expediente.</summary>
    [HttpPost]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(typeof(ApiResponse<ExpedienteDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ExpedienteDto>>> Crear(ExpedienteCrearDto datos)
    {
        var usuarioId = User.ObtenerUsuarioId();
        var expediente = await _expedienteService.CrearAsync(datos, usuarioId);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = expediente.Id },
            ApiResponse<ExpedienteDto>.Correcto(expediente));
    }

    // ── Actualizar ──────────────────────────────────────────────

    /// <summary>Actualiza los datos de un expediente.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(typeof(ApiResponse<ExpedienteDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ExpedienteDto>>> Actualizar(int id, ExpedienteActualizarDto datos)
    {
        var expediente = await _expedienteService.ActualizarAsync(id, datos);
        return Ok(ApiResponse<ExpedienteDto>.Correcto(expediente));
    }

    // ── Cambiar estado ──────────────────────────────────────────

    /// <summary>Cambia el estado de un expediente (abrir/cerrar/reactivar).</summary>
    [HttpPut("{id:int}/estado")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CambiarEstado(int id, ExpedienteEstadoDto solicitud)
    {
        await _expedienteService.CambiarEstadoAsync(id, solicitud);
        return NoContent();
    }

    // ── Eliminar ────────────────────────────────────────────────

    /// <summary>Elimina un expediente (verifica dependencias).</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Eliminar(int id)
    {
        var usuarioId = User.ObtenerUsuarioId();
        await _expedienteService.EliminarAsync(id, usuarioId);
        return NoContent();
    }

    // ════════════════════════════════════════════════════════════
    // PARTES PROCESALES
    // ════════════════════════════════════════════════════════════

    /// <summary>Obtiene las partes procesales de un expediente.</summary>
    [HttpGet("{id:int}/partes")]
    [ProducesResponseType(typeof(ApiResponse<List<ParteProcesalDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<ParteProcesalDto>>>> ObtenerPartes(int id)
    {
        var partes = await _expedienteService.ObtenerPartesAsync(id);
        return Ok(ApiResponse<List<ParteProcesalDto>>.Correcto(partes));
    }

    /// <summary>Agrega una parte procesal al expediente.</summary>
    [HttpPost("{id:int}/partes")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(typeof(ApiResponse<ParteProcesalDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<ParteProcesalDto>>> CrearParte(int id, ParteProcesalCrearDto datos)
    {
        var parte = await _expedienteService.CrearParteAsync(id, datos);
        return CreatedAtAction(nameof(ObtenerPartes), new { id },
            ApiResponse<ParteProcesalDto>.Correcto(parte));
    }

    /// <summary>Actualiza una parte procesal.</summary>
    [HttpPut("partes/{parteId:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarParte(int parteId, ParteProcesalActualizarDto datos)
    {
        await _expedienteService.ActualizarParteAsync(parteId, datos);
        return NoContent();
    }

    /// <summary>Elimina (desactiva) una parte procesal.</summary>
    [HttpDelete("partes/{parteId:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> EliminarParte(int parteId)
    {
        await _expedienteService.EliminarParteAsync(parteId);
        return NoContent();
    }

    // ════════════════════════════════════════════════════════════
    // NOTAS
    // ════════════════════════════════════════════════════════════

    /// <summary>Obtiene las notas de un expediente.</summary>
    [HttpGet("{id:int}/notas")]
    [ProducesResponseType(typeof(ApiResponse<List<NotaExpedienteDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<NotaExpedienteDto>>>> ObtenerNotas(int id)
    {
        var notas = await _expedienteService.ObtenerNotasAsync(id);
        return Ok(ApiResponse<List<NotaExpedienteDto>>.Correcto(notas));
    }

    /// <summary>Agrega una nota al expediente.</summary>
    [HttpPost("{id:int}/notas")]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    [ProducesResponseType(typeof(ApiResponse<NotaExpedienteDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<NotaExpedienteDto>>> CrearNota(int id, NotaExpedienteCrearDto datos)
    {
        var usuarioId = User.ObtenerUsuarioId();
        var nota = await _expedienteService.CrearNotaAsync(id, datos, usuarioId);
        return CreatedAtAction(nameof(ObtenerNotas), new { id },
            ApiResponse<NotaExpedienteDto>.Correcto(nota));
    }

    /// <summary>Actualiza una nota del expediente.</summary>
    [HttpPut("notas/{notaId:int}")]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarNota(int notaId, NotaExpedienteActualizarDto datos)
    {
        await _expedienteService.ActualizarNotaAsync(notaId, datos);
        return NoContent();
    }

    /// <summary>Elimina una nota del expediente.</summary>
    [HttpDelete("notas/{notaId:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> EliminarNota(int notaId)
    {
        await _expedienteService.EliminarNotaAsync(notaId);
        return NoContent();
    }

    // ════════════════════════════════════════════════════════════
    // DOCUMENTOS
    // ════════════════════════════════════════════════════════════

    /// <summary>Obtiene los documentos de un expediente.</summary>
    [HttpGet("{id:int}/documentos")]
    [ProducesResponseType(typeof(ApiResponse<List<DocExpedienteDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<DocExpedienteDto>>>> ObtenerDocumentos(int id)
    {
        var documentos = await _expedienteService.ObtenerDocumentosAsync(id);
        return Ok(ApiResponse<List<DocExpedienteDto>>.Correcto(documentos));
    }

    /// <summary>Registra un documento en el expediente.</summary>
    [HttpPost("{id:int}/documentos")]
    [Authorize(Roles = "Administrador,Abogado,Secretaria")]
    [ProducesResponseType(typeof(ApiResponse<DocExpedienteDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<DocExpedienteDto>>> CrearDocumento(int id, DocExpedienteCrearDto datos)
    {
        var usuarioId = User.ObtenerUsuarioId();
        var documento = await _expedienteService.CrearDocumentoAsync(id, datos, usuarioId);
        return CreatedAtAction(nameof(ObtenerDocumentos), new { id },
            ApiResponse<DocExpedienteDto>.Correcto(documento));
    }

    /// <summary>Elimina un documento del expediente.</summary>
    [HttpDelete("documentos/{documentoId:int}")]
    [Authorize(Roles = "Administrador,Abogado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> EliminarDocumento(int documentoId)
    {
        await _expedienteService.EliminarDocumentoAsync(documentoId);
        return NoContent();
    }

    // ── Helpers ──────────────────────────────────────────────────
}

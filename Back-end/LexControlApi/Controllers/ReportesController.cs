using LexControlApi.Dtos.Reportes;
using LexControlApi.Helpers;
using LexControlApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LexControlApi.Controllers;

[ApiController]
[Route("api/reportes")]
[Authorize]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _service;

    public ReportesController(IReporteService service) => _service = service;

    [HttpGet("expedientes-por-estado")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<ExpedientesPorEstadoResumen, ExpedientesPorEstadoDetalle>>>> ExpedientesPorEstado(
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin, [FromQuery] int? usuarioId)
    {
        var resultado = await _service.ExpedientesPorEstadoAsync(fechaInicio, fechaFin, usuarioId);
        return Ok(ApiResponse<ReporteRespuesta<ExpedientesPorEstadoResumen, ExpedientesPorEstadoDetalle>>.Correcto(resultado));
    }

    [HttpGet("plazos-vencimiento")]
    public async Task<ActionResult<ApiResponse<List<PlazoVencimiento>>>> PlazosVencimiento(
        [FromQuery] int? usuarioId, [FromQuery] int? diasAnticipacion)
    {
        var resultado = await _service.PlazosVencimientoAsync(usuarioId, diasAnticipacion);
        return Ok(ApiResponse<List<PlazoVencimiento>>.Correcto(resultado));
    }

    [HttpGet("expedientes-por-rama")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<ExpedientesPorRamaResumen, ExpedientesPorRamaDetalle>>>> ExpedientesPorRama(
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin,
        [FromQuery] int? estadoId, [FromQuery] int? ramaId, [FromQuery] int? usuarioId)
    {
        var resultado = await _service.ExpedientesPorRamaAsync(fechaInicio, fechaFin, estadoId, ramaId, usuarioId);
        return Ok(ApiResponse<ReporteRespuesta<ExpedientesPorRamaResumen, ExpedientesPorRamaDetalle>>.Correcto(resultado));
    }

    [HttpGet("expedientes-por-juzgado")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<ExpedientesPorJuzgadoResumen, ExpedientesPorJuzgadoDetalle>>>> ExpedientesPorJuzgado(
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin,
        [FromQuery] int? estadoId, [FromQuery] int? juzgadoId, [FromQuery] int? usuarioId)
    {
        var resultado = await _service.ExpedientesPorJuzgadoAsync(fechaInicio, fechaFin, estadoId, juzgadoId, usuarioId);
        return Ok(ApiResponse<ReporteRespuesta<ExpedientesPorJuzgadoResumen, ExpedientesPorJuzgadoDetalle>>.Correcto(resultado));
    }

    [HttpGet("antiguedad-expedientes")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<AntiguedadExpedientesResumen, AntiguedadExpedientesDetalle>>>> AntiguedadExpedientes(
        [FromQuery] int? estadoId, [FromQuery] int? ramaId, [FromQuery] int? juzgadoId, [FromQuery] int? usuarioId)
    {
        var resultado = await _service.AntiguedadExpedientesAsync(estadoId, ramaId, juzgadoId, usuarioId);
        return Ok(ApiResponse<ReporteRespuesta<AntiguedadExpedientesResumen, AntiguedadExpedientesDetalle>>.Correcto(resultado));
    }

    [HttpGet("actividad-audiencias")]
    public async Task<ActionResult<ApiResponse<ActividadAudienciasRespuesta>>> ActividadAudiencias(
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin,
        [FromQuery] int? tipoId, [FromQuery] int? estadoId, [FromQuery] int? juzgadoId, [FromQuery] int? usuarioId)
    {
        var resultado = await _service.ActividadAudienciasAsync(fechaInicio, fechaFin, tipoId, estadoId, juzgadoId, usuarioId);
        return Ok(ApiResponse<ActividadAudienciasRespuesta>.Correcto(resultado));
    }

    [HttpGet("gestion-tramites")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<GestionTramitesResumen, GestionTramitesDetalle>>>> GestionTramites(
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin,
        [FromQuery] int? tipoId, [FromQuery] int? estadoId, [FromQuery] string? institucion, [FromQuery] int? usuarioId)
    {
        var resultado = await _service.GestionTramitesAsync(fechaInicio, fechaFin, tipoId, estadoId, institucion, usuarioId);
        return Ok(ApiResponse<ReporteRespuesta<GestionTramitesResumen, GestionTramitesDetalle>>.Correcto(resultado));
    }

    [HttpGet("notificaciones-oj")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<NotificacionesOJResumen, NotificacionesOJDetalle>>>> NotificacionesOJ(
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin,
        [FromQuery] int? tipoId, [FromQuery] int? estadoId, [FromQuery] int? juzgadoId, [FromQuery] bool? soloPendientes)
    {
        var resultado = await _service.NotificacionesOJAsync(fechaInicio, fechaFin, tipoId, estadoId, juzgadoId, soloPendientes);
        return Ok(ApiResponse<ReporteRespuesta<NotificacionesOJResumen, NotificacionesOJDetalle>>.Correcto(resultado));
    }

    [HttpGet("diligencias")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<DiligenciasResumen, DiligenciasDetalle>>>> Diligencias(
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin,
        [FromQuery] int? tipoId, [FromQuery] int? estadoId, [FromQuery] int? usuarioId)
    {
        var resultado = await _service.DiligenciasAsync(fechaInicio, fechaFin, tipoId, estadoId, usuarioId);
        return Ok(ApiResponse<ReporteRespuesta<DiligenciasResumen, DiligenciasDetalle>>.Correcto(resultado));
    }

    [HttpGet("alertas-pendientes")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<AlertasPendientesResumen, AlertasPendientesDetalle>>>> AlertasPendientes(
        [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin,
        [FromQuery] string? tipoAlerta, [FromQuery] bool? soloNoLeidas)
    {
        var resultado = await _service.AlertasPendientesAsync(fechaInicio, fechaFin, tipoAlerta, soloNoLeidas);
        return Ok(ApiResponse<ReporteRespuesta<AlertasPendientesResumen, AlertasPendientesDetalle>>.Correcto(resultado));
    }

    [HttpGet("eventos-agenda-mes")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<EventosAgendaMesResumen, EventosAgendaMesDetalle>>>> EventosAgendaMes(
        [FromQuery] int? anio, [FromQuery] int? mes, [FromQuery] string? tipoEvento,
        [FromQuery] int? estadoId, [FromQuery] int? usuarioId)
    {
        var resultado = await _service.EventosAgendaMesAsync(anio, mes, tipoEvento, estadoId, usuarioId);
        return Ok(ApiResponse<ReporteRespuesta<EventosAgendaMesResumen, EventosAgendaMesDetalle>>.Correcto(resultado));
    }

    [HttpGet("clientes-por-tipo")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<ClientesPorTipoResumen, ClientesPorTipoDetalle>>>> ClientesPorTipo(
        [FromQuery] string? tipoCliente, [FromQuery] bool? activo)
    {
        var resultado = await _service.ClientesPorTipoAsync(tipoCliente, activo);
        return Ok(ApiResponse<ReporteRespuesta<ClientesPorTipoResumen, ClientesPorTipoDetalle>>.Correcto(resultado));
    }

    [HttpGet("carga-por-abogado")]
    public async Task<ActionResult<ApiResponse<ReporteRespuesta<CargaPorAbogadoResumen, CargaPorAbogadoDetalle>>>> CargaPorAbogado(
        [FromQuery] int? usuarioId, [FromQuery] int? ramaId, [FromQuery] int? estadoId)
    {
        var resultado = await _service.CargaPorAbogadoAsync(usuarioId, ramaId, estadoId);
        return Ok(ApiResponse<ReporteRespuesta<CargaPorAbogadoResumen, CargaPorAbogadoDetalle>>.Correcto(resultado));
    }
}

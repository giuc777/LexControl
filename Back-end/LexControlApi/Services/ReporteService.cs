using LexControlApi.Data;
using LexControlApi.Dtos.Reportes;

namespace LexControlApi.Services;

public interface IReporteService
{
    Task<ReporteRespuesta<ExpedientesPorEstadoResumen, ExpedientesPorEstadoDetalle>> ExpedientesPorEstadoAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? usuarioId);
    Task<List<PlazoVencimiento>> PlazosVencimientoAsync(int? usuarioId, int? diasAnticipacion);
    Task<ReporteRespuesta<ExpedientesPorRamaResumen, ExpedientesPorRamaDetalle>> ExpedientesPorRamaAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? estadoId, int? ramaId, int? usuarioId);
    Task<ReporteRespuesta<ExpedientesPorJuzgadoResumen, ExpedientesPorJuzgadoDetalle>> ExpedientesPorJuzgadoAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? estadoId, int? juzgadoId, int? usuarioId);
    Task<ReporteRespuesta<AntiguedadExpedientesResumen, AntiguedadExpedientesDetalle>> AntiguedadExpedientesAsync(
        int? estadoId, int? ramaId, int? juzgadoId, int? usuarioId);
    Task<ActividadAudienciasRespuesta> ActividadAudienciasAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? tipoId, int? estadoId, int? juzgadoId, int? usuarioId);
    Task<ReporteRespuesta<GestionTramitesResumen, GestionTramitesDetalle>> GestionTramitesAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? tipoId, int? estadoId, string? institucion, int? usuarioId);
    Task<ReporteRespuesta<NotificacionesOJResumen, NotificacionesOJDetalle>> NotificacionesOJAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? tipoId, int? estadoId, int? juzgadoId, bool? soloPendientes);
    Task<ReporteRespuesta<DiligenciasResumen, DiligenciasDetalle>> DiligenciasAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? tipoId, int? estadoId, int? usuarioId);
    Task<ReporteRespuesta<AlertasPendientesResumen, AlertasPendientesDetalle>> AlertasPendientesAsync(
        DateTime? fechaInicio, DateTime? fechaFin, string? tipoAlerta, bool? soloNoLeidas);
    Task<ReporteRespuesta<EventosAgendaMesResumen, EventosAgendaMesDetalle>> EventosAgendaMesAsync(
        int? anio, int? mes, string? tipoEvento, int? estadoId, int? usuarioId);
}

public class ReporteService : IReporteService
{
    private readonly IRepositorio _repositorio;

    public ReporteService(IRepositorio repositorio) => _repositorio = repositorio;

    public async Task<ReporteRespuesta<ExpedientesPorEstadoResumen, ExpedientesPorEstadoDetalle>> ExpedientesPorEstadoAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? usuarioId)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_ExpedientesPorEstado",
            new { FechaInicio = fechaInicio, FechaFin = fechaFin, Usuario_ID = usuarioId });
        return new ReporteRespuesta<ExpedientesPorEstadoResumen, ExpedientesPorEstadoDetalle>
        {
            Resumen = (await grid.ReadAsync<ExpedientesPorEstadoResumen>()).ToList(),
            Detalle = (await grid.ReadAsync<ExpedientesPorEstadoDetalle>()).ToList()
        };
    }

    public async Task<List<PlazoVencimiento>> PlazosVencimientoAsync(int? usuarioId, int? diasAnticipacion)
    {
        return (await _repositorio.ConsultarListaAsync<PlazoVencimiento>(
            "SP_Reporte_PlazosVencimiento",
            new { Usuario_ID = usuarioId, DiasAnticipacion = diasAnticipacion ?? 15 })).ToList();
    }

    public async Task<ReporteRespuesta<ExpedientesPorRamaResumen, ExpedientesPorRamaDetalle>> ExpedientesPorRamaAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? estadoId, int? ramaId, int? usuarioId)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_ExpedientesPorRama",
            new { FechaInicio = fechaInicio, FechaFin = fechaFin, Estado_ID = estadoId, Rama_ID = ramaId, Usuario_ID = usuarioId });
        return new ReporteRespuesta<ExpedientesPorRamaResumen, ExpedientesPorRamaDetalle>
        {
            Resumen = (await grid.ReadAsync<ExpedientesPorRamaResumen>()).ToList(),
            Detalle = (await grid.ReadAsync<ExpedientesPorRamaDetalle>()).ToList()
        };
    }

    public async Task<ReporteRespuesta<ExpedientesPorJuzgadoResumen, ExpedientesPorJuzgadoDetalle>> ExpedientesPorJuzgadoAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? estadoId, int? juzgadoId, int? usuarioId)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_ExpedientesPorJuzgado",
            new { FechaInicio = fechaInicio, FechaFin = fechaFin, Estado_ID = estadoId, Juzgado_ID = juzgadoId, Usuario_ID = usuarioId });
        return new ReporteRespuesta<ExpedientesPorJuzgadoResumen, ExpedientesPorJuzgadoDetalle>
        {
            Resumen = (await grid.ReadAsync<ExpedientesPorJuzgadoResumen>()).ToList(),
            Detalle = (await grid.ReadAsync<ExpedientesPorJuzgadoDetalle>()).ToList()
        };
    }

    public async Task<ReporteRespuesta<AntiguedadExpedientesResumen, AntiguedadExpedientesDetalle>> AntiguedadExpedientesAsync(
        int? estadoId, int? ramaId, int? juzgadoId, int? usuarioId)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_AntiguedadExpedientes",
            new { Estado_ID = estadoId, Rama_ID = ramaId, Juzgado_ID = juzgadoId, Usuario_ID = usuarioId });
        return new ReporteRespuesta<AntiguedadExpedientesResumen, AntiguedadExpedientesDetalle>
        {
            Resumen = (await grid.ReadAsync<AntiguedadExpedientesResumen>()).ToList(),
            Detalle = (await grid.ReadAsync<AntiguedadExpedientesDetalle>()).ToList()
        };
    }

    public async Task<ActividadAudienciasRespuesta> ActividadAudienciasAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? tipoId, int? estadoId, int? juzgadoId, int? usuarioId)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_ActividadAudiencias",
            new { FechaInicio = fechaInicio, FechaFin = fechaFin, Tipo_ID = tipoId, Estado_ID = estadoId, Juzgado_ID = juzgadoId, Usuario_ID = usuarioId });
        return new ActividadAudienciasRespuesta
        {
            ResumenEstados = (await grid.ReadAsync<ActividadAudienciasResumenEstado>()).ToList(),
            ResumenResultados = (await grid.ReadAsync<ActividadAudienciasResumenResultado>()).ToList(),
            Detalle = (await grid.ReadAsync<ActividadAudienciasDetalle>()).ToList()
        };
    }

    public async Task<ReporteRespuesta<GestionTramitesResumen, GestionTramitesDetalle>> GestionTramitesAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? tipoId, int? estadoId, string? institucion, int? usuarioId)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_GestionTramites",
            new { FechaInicio = fechaInicio, FechaFin = fechaFin, Tipo_ID = tipoId, Estado_ID = estadoId, Institucion = institucion, Usuario_ID = usuarioId });
        return new ReporteRespuesta<GestionTramitesResumen, GestionTramitesDetalle>
        {
            Resumen = (await grid.ReadAsync<GestionTramitesResumen>()).ToList(),
            Detalle = (await grid.ReadAsync<GestionTramitesDetalle>()).ToList()
        };
    }

    public async Task<ReporteRespuesta<NotificacionesOJResumen, NotificacionesOJDetalle>> NotificacionesOJAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? tipoId, int? estadoId, int? juzgadoId, bool? soloPendientes)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_NotificacionesOJ",
            new { FechaInicio = fechaInicio, FechaFin = fechaFin, Tipo_ID = tipoId, Estado_ID = estadoId, Juzgado_ID = juzgadoId, SoloPendientes = soloPendientes ?? false });
        return new ReporteRespuesta<NotificacionesOJResumen, NotificacionesOJDetalle>
        {
            Resumen = (await grid.ReadAsync<NotificacionesOJResumen>()).ToList(),
            Detalle = (await grid.ReadAsync<NotificacionesOJDetalle>()).ToList()
        };
    }

    public async Task<ReporteRespuesta<DiligenciasResumen, DiligenciasDetalle>> DiligenciasAsync(
        DateTime? fechaInicio, DateTime? fechaFin, int? tipoId, int? estadoId, int? usuarioId)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_Diligencias",
            new { FechaInicio = fechaInicio, FechaFin = fechaFin, Tipo_ID = tipoId, Estado_ID = estadoId, Usuario_ID = usuarioId });
        return new ReporteRespuesta<DiligenciasResumen, DiligenciasDetalle>
        {
            Resumen = (await grid.ReadAsync<DiligenciasResumen>()).ToList(),
            Detalle = (await grid.ReadAsync<DiligenciasDetalle>()).ToList()
        };
    }

    public async Task<ReporteRespuesta<AlertasPendientesResumen, AlertasPendientesDetalle>> AlertasPendientesAsync(
        DateTime? fechaInicio, DateTime? fechaFin, string? tipoAlerta, bool? soloNoLeidas)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_AlertasPendientes",
            new { FechaInicio = fechaInicio, FechaFin = fechaFin, TipoAlerta = tipoAlerta, SoloNoLeidas = soloNoLeidas ?? false });
        return new ReporteRespuesta<AlertasPendientesResumen, AlertasPendientesDetalle>
        {
            Resumen = (await grid.ReadAsync<AlertasPendientesResumen>()).ToList(),
            Detalle = (await grid.ReadAsync<AlertasPendientesDetalle>()).ToList()
        };
    }

    public async Task<ReporteRespuesta<EventosAgendaMesResumen, EventosAgendaMesDetalle>> EventosAgendaMesAsync(
        int? anio, int? mes, string? tipoEvento, int? estadoId, int? usuarioId)
    {
        using var grid = await _repositorio.ConsultarMultiplesAsync(
            "SP_Reporte_EventosAgendaMes",
            new { Anio = anio, Mes = mes, TipoEvento = tipoEvento, Estado_ID = estadoId, Usuario_ID = usuarioId });
        return new ReporteRespuesta<EventosAgendaMesResumen, EventosAgendaMesDetalle>
        {
            Resumen = (await grid.ReadAsync<EventosAgendaMesResumen>()).ToList(),
            Detalle = (await grid.ReadAsync<EventosAgendaMesDetalle>()).ToList()
        };
    }
}

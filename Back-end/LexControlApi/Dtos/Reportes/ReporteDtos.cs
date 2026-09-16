namespace LexControlApi.Dtos.Reportes;

/// <summary>Respuesta genérica para reportes con resumen y detalle.</summary>
public class ReporteRespuesta<TResumen, TDetalle>
{
    public List<TResumen> Resumen { get; set; } = new();
    public List<TDetalle> Detalle { get; set; } = new();
}

// ============================================================
// 1. Expedientes por Estado
// ============================================================

public class ExpedientesPorEstadoResumen
{
    public string Estado { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int Cantidad { get; set; }
    public decimal Porcentaje { get; set; }
}

public class ExpedientesPorEstadoDetalle
{
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? RolProcesal { get; set; }
    public string? Rama { get; set; }
    public string? Estado { get; set; }
    public string? EstadoColor { get; set; }
    public string? FechaIngreso { get; set; }
    public string? FechaCierre { get; set; }
    public string? Abogado { get; set; }
}

// ============================================================
// 2. Plazos de Vencimiento
// ============================================================

public class PlazoVencimiento
{
    public int ID { get; set; }
    public string? Titulo { get; set; }
    public string? FechaVencimiento { get; set; }
    public int? DiasRestantes { get; set; }
    public string? TipoPlazo { get; set; }
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? Prioridad { get; set; }
    public string? ColorEvento { get; set; }
    public string? NivelUrgencia { get; set; }
}

// ============================================================
// 3. Expedientes por Rama
// ============================================================

public class ExpedientesPorRamaResumen
{
    public string Rama { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int Cantidad { get; set; }
    public decimal Porcentaje { get; set; }
}

public class ExpedientesPorRamaDetalle
{
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? Rama { get; set; }
    public string? RamaColor { get; set; }
    public string? Estado { get; set; }
    public string? EstadoColor { get; set; }
    public string? Juzgado { get; set; }
    public string? FechaIngreso { get; set; }
    public string? Abogado { get; set; }
}

// ============================================================
// 4. Expedientes por Juzgado
// ============================================================

public class ExpedientesPorJuzgadoResumen
{
    public string Juzgado { get; set; } = string.Empty;
    public string? TipoJuzgado { get; set; }
    public int Cantidad { get; set; }
    public decimal Porcentaje { get; set; }
}

public class ExpedientesPorJuzgadoDetalle
{
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? Juzgado { get; set; }
    public string? TipoJuzgado { get; set; }
    public string? Estado { get; set; }
    public string? Rama { get; set; }
    public string? FechaIngreso { get; set; }
    public string? Abogado { get; set; }
}

// ============================================================
// 5. Antigüedad de Expedientes
// ============================================================

public class AntiguedadExpedientesResumen
{
    public string RangoAntiguedad { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal Porcentaje { get; set; }
}

public class AntiguedadExpedientesDetalle
{
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? Rama { get; set; }
    public string? Juzgado { get; set; }
    public string? Estado { get; set; }
    public string? FechaIngreso { get; set; }
    public int? DiasTranscurridos { get; set; }
    public string? RangoAntiguedad { get; set; }
    public string? Abogado { get; set; }
}

// ============================================================
// 6. Actividad de Audiencias
// ============================================================

public class ActividadAudienciasResumenEstado
{
    public string Estado { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int Cantidad { get; set; }
    public decimal Porcentaje { get; set; }
}

public class ActividadAudienciasResumenResultado
{
    public string Resultado { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int Cantidad { get; set; }
}

public class ActividadAudienciasDetalle
{
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? Tipo { get; set; }
    public string? Estado { get; set; }
    public string? Resultado { get; set; }
    public string? Fecha { get; set; }
    public string? HoraInicio { get; set; }
    public string? Juzgado { get; set; }
    public string? Sala { get; set; }
    public string? ProximaActuacion { get; set; }
}

/// <summary>Respuesta especial para audiencias (3 conjuntos de resultados).</summary>
public class ActividadAudienciasRespuesta
{
    public List<ActividadAudienciasResumenEstado> ResumenEstados { get; set; } = new();
    public List<ActividadAudienciasResumenResultado> ResumenResultados { get; set; } = new();
    public List<ActividadAudienciasDetalle> Detalle { get; set; } = new();
}

// ============================================================
// 7. Gestión de Trámites
// ============================================================

public class GestionTramitesResumen
{
    public string Tipo { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int Ingresados { get; set; }
    public int Resueltos { get; set; }
    public int Pendientes { get; set; }
    public decimal? PromedioDiasResolucion { get; set; }
}

public class GestionTramitesDetalle
{
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? Tipo { get; set; }
    public string? Institucion { get; set; }
    public string? Estado { get; set; }
    public string? FechaIngreso { get; set; }
    public string? FechaResolucion { get; set; }
    public int? DiasGestion { get; set; }
    public string? OficioReferencia { get; set; }
    public string? ResumenResolucion { get; set; }
}

// ============================================================
// 8. Notificaciones OJ
// ============================================================

public class NotificacionesOJResumen
{
    public string Tipo { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int Recibidas { get; set; }
    public int Atendidas { get; set; }
    public int Pendientes { get; set; }
    public decimal? PromedioDiasAtencion { get; set; }
}

public class NotificacionesOJDetalle
{
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? Tipo { get; set; }
    public string? Estado { get; set; }
    public string? Juzgado { get; set; }
    public string? FechaRecepcion { get; set; }
    public string? FechaAtencion { get; set; }
    public int? DiasTranscurridos { get; set; }
    public string? NumeroResolucion { get; set; }
    public bool? EsResolucion { get; set; }
    public bool? Favorable { get; set; }
}

// ============================================================
// 9. Diligencias
// ============================================================

public class DiligenciasResumen
{
    public string Tipo { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int Cantidad { get; set; }
    public int Completadas { get; set; }
    public int Pendientes { get; set; }
}

public class DiligenciasDetalle
{
    public string? Titulo { get; set; }
    public string? NoExpediente { get; set; }
    public string? Vinculado { get; set; }
    public string? Tipo { get; set; }
    public string? Estado { get; set; }
    public string? Fecha { get; set; }
    public string? HoraInicio { get; set; }
    public string? Ubicacion { get; set; }
    public string? TiempoDedicado { get; set; }
    public string? Encargado { get; set; }
}

// ============================================================
// 10. Alertas Pendientes
// ============================================================

public class AlertasPendientesResumen
{
    public string TipoAlerta { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public int NoLeidas { get; set; }
}

public class AlertasPendientesDetalle
{
    public string? Titulo { get; set; }
    public string? TipoAlerta { get; set; }
    public string? Descripcion { get; set; }
    public string? FechaAlerta { get; set; }
    public int? DiasTranscurridos { get; set; }
    public string? ReferenciaTabla { get; set; }
    public int? ReferenciaId { get; set; }
    public bool? Leida { get; set; }
    public string? NoExpediente { get; set; }
}

// ============================================================
// 11. Eventos Agenda Mes
// ============================================================

public class EventosAgendaMesResumen
{
    public string TipoEvento { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public int Pendientes { get; set; }
}

public class EventosAgendaMesDetalle
{
    public string? Titulo { get; set; }
    public string? TipoEvento { get; set; }
    public string? Estado { get; set; }
    public string? Fecha { get; set; }
    public string? HoraInicio { get; set; }
    public string? HoraFin { get; set; }
    public string? Ubicacion { get; set; }
    public string? Prioridad { get; set; }
    public string? NoExpediente { get; set; }
    public string? Cliente { get; set; }
    public string? Subtipo { get; set; }
    public string? FechaVencimiento { get; set; }
    public int? DiasRestantes { get; set; }
}

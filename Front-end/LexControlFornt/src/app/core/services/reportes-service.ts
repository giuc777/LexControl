import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    ActividadAudienciasRespuesta,
    AlertasPendientesDetalle,
    AlertasPendientesResumen,
    AntiguedadExpedientesDetalle,
    AntiguedadExpedientesResumen,
    CargaPorAbogadoDetalle,
    CargaPorAbogadoResumen,
    ClientesPorTipoDetalle,
    ClientesPorTipoResumen,
    DiligenciasDetalle,
    DiligenciasResumen,
    EventosAgendaMesDetalle,
    EventosAgendaMesResumen,
    ExpedientesPorEstadoDetalle,
    ExpedientesPorEstadoResumen,
    ExpedientesPorJuzgadoDetalle,
    ExpedientesPorJuzgadoResumen,
    ExpedientesPorRamaDetalle,
    ExpedientesPorRamaResumen,
    GestionTramitesDetalle,
    GestionTramitesResumen,
    NotificacionesOJDetalle,
    NotificacionesOJResumen,
    PlazoVencimiento,
    ReporteRespuesta
} from '../models/reporte.model';

/* Servicio HTTP del modulo Reportes. */
@Injectable({ providedIn: 'root' })
export class ReportesService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/reportes`;

    expedientesPorEstado(filtros: { fechaInicio?: string | null; fechaFin?: string | null; usuarioId?: number | null } = {}): Observable<ReporteRespuesta<ExpedientesPorEstadoResumen, ExpedientesPorEstadoDetalle>> {
        let params = new HttpParams();
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        return this.http.get<RespuestaApi<ReporteRespuesta<ExpedientesPorEstadoResumen, ExpedientesPorEstadoDetalle>>>(`${this.base}/expedientes-por-estado`, { params }).pipe(map(r => r.data));
    }

    plazosVencimiento(filtros: { usuarioId?: number | null; diasAnticipacion?: number | null } = {}): Observable<PlazoVencimiento[]> {
        let params = new HttpParams();
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        if (filtros.diasAnticipacion != null) params = params.set('diasAnticipacion', String(filtros.diasAnticipacion));
        return this.http.get<RespuestaApi<PlazoVencimiento[]>>(`${this.base}/plazos-vencimiento`, { params }).pipe(map(r => r.data));
    }

    expedientesPorRama(filtros: { fechaInicio?: string | null; fechaFin?: string | null; estadoId?: number | null; ramaId?: number | null; usuarioId?: number | null } = {}): Observable<ReporteRespuesta<ExpedientesPorRamaResumen, ExpedientesPorRamaDetalle>> {
        let params = new HttpParams();
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.ramaId != null) params = params.set('ramaId', String(filtros.ramaId));
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        return this.http.get<RespuestaApi<ReporteRespuesta<ExpedientesPorRamaResumen, ExpedientesPorRamaDetalle>>>(`${this.base}/expedientes-por-rama`, { params }).pipe(map(r => r.data));
    }

    expedientesPorJuzgado(filtros: { fechaInicio?: string | null; fechaFin?: string | null; estadoId?: number | null; juzgadoId?: number | null; usuarioId?: number | null } = {}): Observable<ReporteRespuesta<ExpedientesPorJuzgadoResumen, ExpedientesPorJuzgadoDetalle>> {
        let params = new HttpParams();
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.juzgadoId != null) params = params.set('juzgadoId', String(filtros.juzgadoId));
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        return this.http.get<RespuestaApi<ReporteRespuesta<ExpedientesPorJuzgadoResumen, ExpedientesPorJuzgadoDetalle>>>(`${this.base}/expedientes-por-juzgado`, { params }).pipe(map(r => r.data));
    }

    antiguedadExpedientes(filtros: { estadoId?: number | null; ramaId?: number | null; juzgadoId?: number | null; usuarioId?: number | null } = {}): Observable<ReporteRespuesta<AntiguedadExpedientesResumen, AntiguedadExpedientesDetalle>> {
        let params = new HttpParams();
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.ramaId != null) params = params.set('ramaId', String(filtros.ramaId));
        if (filtros.juzgadoId != null) params = params.set('juzgadoId', String(filtros.juzgadoId));
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        return this.http.get<RespuestaApi<ReporteRespuesta<AntiguedadExpedientesResumen, AntiguedadExpedientesDetalle>>>(`${this.base}/antiguedad-expedientes`, { params }).pipe(map(r => r.data));
    }

    actividadAudiencias(filtros: { fechaInicio?: string | null; fechaFin?: string | null; tipoId?: number | null; estadoId?: number | null; juzgadoId?: number | null; usuarioId?: number | null } = {}): Observable<ActividadAudienciasRespuesta> {
        let params = new HttpParams();
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.tipoId != null) params = params.set('tipoId', String(filtros.tipoId));
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.juzgadoId != null) params = params.set('juzgadoId', String(filtros.juzgadoId));
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        return this.http.get<RespuestaApi<ActividadAudienciasRespuesta>>(`${this.base}/actividad-audiencias`, { params }).pipe(map(r => r.data));
    }

    gestionTramites(filtros: { fechaInicio?: string | null; fechaFin?: string | null; tipoId?: number | null; estadoId?: number | null; institucion?: string | null; usuarioId?: number | null } = {}): Observable<ReporteRespuesta<GestionTramitesResumen, GestionTramitesDetalle>> {
        let params = new HttpParams();
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.tipoId != null) params = params.set('tipoId', String(filtros.tipoId));
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.institucion) params = params.set('institucion', filtros.institucion);
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        return this.http.get<RespuestaApi<ReporteRespuesta<GestionTramitesResumen, GestionTramitesDetalle>>>(`${this.base}/gestion-tramites`, { params }).pipe(map(r => r.data));
    }

    notificacionesOJ(filtros: { fechaInicio?: string | null; fechaFin?: string | null; tipoId?: number | null; estadoId?: number | null; juzgadoId?: number | null; soloPendientes?: boolean | null } = {}): Observable<ReporteRespuesta<NotificacionesOJResumen, NotificacionesOJDetalle>> {
        let params = new HttpParams();
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.tipoId != null) params = params.set('tipoId', String(filtros.tipoId));
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.juzgadoId != null) params = params.set('juzgadoId', String(filtros.juzgadoId));
        if (filtros.soloPendientes != null) params = params.set('soloPendientes', String(filtros.soloPendientes));
        return this.http.get<RespuestaApi<ReporteRespuesta<NotificacionesOJResumen, NotificacionesOJDetalle>>>(`${this.base}/notificaciones-oj`, { params }).pipe(map(r => r.data));
    }

    diligencias(filtros: { fechaInicio?: string | null; fechaFin?: string | null; tipoId?: number | null; estadoId?: number | null; usuarioId?: number | null } = {}): Observable<ReporteRespuesta<DiligenciasResumen, DiligenciasDetalle>> {
        let params = new HttpParams();
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.tipoId != null) params = params.set('tipoId', String(filtros.tipoId));
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        return this.http.get<RespuestaApi<ReporteRespuesta<DiligenciasResumen, DiligenciasDetalle>>>(`${this.base}/diligencias`, { params }).pipe(map(r => r.data));
    }

    alertasPendientes(filtros: { fechaInicio?: string | null; fechaFin?: string | null; tipoAlerta?: string | null; soloNoLeidas?: boolean | null } = {}): Observable<ReporteRespuesta<AlertasPendientesResumen, AlertasPendientesDetalle>> {
        let params = new HttpParams();
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
        if (filtros.tipoAlerta) params = params.set('tipoAlerta', filtros.tipoAlerta);
        if (filtros.soloNoLeidas != null) params = params.set('soloNoLeidas', String(filtros.soloNoLeidas));
        return this.http.get<RespuestaApi<ReporteRespuesta<AlertasPendientesResumen, AlertasPendientesDetalle>>>(`${this.base}/alertas-pendientes`, { params }).pipe(map(r => r.data));
    }

    eventosAgendaMes(filtros: { anio?: number | null; mes?: number | null; tipoEvento?: string | null; estadoId?: number | null; usuarioId?: number | null } = {}): Observable<ReporteRespuesta<EventosAgendaMesResumen, EventosAgendaMesDetalle>> {
        let params = new HttpParams();
        if (filtros.anio != null) params = params.set('anio', String(filtros.anio));
        if (filtros.mes != null) params = params.set('mes', String(filtros.mes));
        if (filtros.tipoEvento) params = params.set('tipoEvento', filtros.tipoEvento);
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        return this.http.get<RespuestaApi<ReporteRespuesta<EventosAgendaMesResumen, EventosAgendaMesDetalle>>>(`${this.base}/eventos-agenda-mes`, { params }).pipe(map(r => r.data));
    }

    clientesPorTipo(filtros: { tipoCliente?: string | null; activo?: boolean | null } = {}): Observable<ReporteRespuesta<ClientesPorTipoResumen, ClientesPorTipoDetalle>> {
        let params = new HttpParams();
        if (filtros.tipoCliente) params = params.set('tipoCliente', filtros.tipoCliente);
        if (filtros.activo != null) params = params.set('activo', String(filtros.activo));
        return this.http.get<RespuestaApi<ReporteRespuesta<ClientesPorTipoResumen, ClientesPorTipoDetalle>>>(`${this.base}/clientes-por-tipo`, { params }).pipe(map(r => r.data));
    }

    cargaPorAbogado(filtros: { usuarioId?: number | null; ramaId?: number | null; estadoId?: number | null } = {}): Observable<ReporteRespuesta<CargaPorAbogadoResumen, CargaPorAbogadoDetalle>> {
        let params = new HttpParams();
        if (filtros.usuarioId != null) params = params.set('usuarioId', String(filtros.usuarioId));
        if (filtros.ramaId != null) params = params.set('ramaId', String(filtros.ramaId));
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        return this.http.get<RespuestaApi<ReporteRespuesta<CargaPorAbogadoResumen, CargaPorAbogadoDetalle>>>(`${this.base}/carga-por-abogado`, { params }).pipe(map(r => r.data));
    }
}

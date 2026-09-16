import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    NotificacionActualizar,
    NotificacionAtender,
    NotificacionCrear,
    NotificacionDetalle,
    NotificacionLista
} from '../models/notificacion.model';

/* Servicio HTTP del modulo Notificaciones OJ. */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/notificaciones`;

    listar(filtros: {
        expedienteId?: number | null;
        estadoId?: number | null;
        tipoId?: number | null;
        juzgadoId?: number | null;
        fechaInicio?: string | null;
        fechaFin?: string | null;
    } = {}): Observable<NotificacionLista[]> {
        let params = new HttpParams();
        if (filtros.expedienteId != null) params = params.set('expedienteId', String(filtros.expedienteId));
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.tipoId != null) params = params.set('tipoId', String(filtros.tipoId));
        if (filtros.juzgadoId != null) params = params.set('juzgadoId', String(filtros.juzgadoId));
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);

        return this.http
            .get<RespuestaApi<NotificacionLista[]>>(this.base, { params })
            .pipe(map(r => r.data));
    }

    obtenerPorId(id: number): Observable<NotificacionDetalle> {
        return this.http
            .get<RespuestaApi<NotificacionDetalle>>(`${this.base}/${id}`)
            .pipe(map(r => r.data));
    }

    crear(dto: NotificacionCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(this.base, dto)
            .pipe(map(r => r.data));
    }

    actualizar(id: number, dto: NotificacionActualizar): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}`, dto);
    }

    atender(id: number, dto: NotificacionAtender): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}/atender`, dto);
    }
}

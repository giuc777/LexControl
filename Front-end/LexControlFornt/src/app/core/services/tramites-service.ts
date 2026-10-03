import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    Tramite,
    TramiteCrear,
    TramiteDetalle,
    TramiteActualizarEstado,
    NotaTramite,
    NotaTramiteCrear
} from '../models/tramite.model';

@Injectable({ providedIn: 'root' })
export class TramitesService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/tramites`;

    listar(filtros: {
        expedienteId?: number;
        estadoId?: number;
        tipoId?: number;
        fechaInicio?: string;
        fechaFin?: string;
    }): Observable<Tramite[]> {
        let params = new HttpParams();
        Object.entries(filtros).forEach(([k, v]) => {
            if (v !== undefined && v !== null) params = params.set(k, String(v));
        });
        return this.http
            .get<RespuestaApi<Tramite[]>>(this.base, { params })
            .pipe(map(r => r.data));
    }

    obtenerPorId(id: number): Observable<TramiteDetalle> {
        return this.http
            .get<RespuestaApi<TramiteDetalle>>(`${this.base}/${id}`)
            .pipe(map(r => r.data));
    }

    crear(dto: TramiteCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(this.base, dto)
            .pipe(map(r => r.data));
    }

    actualizarEstado(id: number, dto: TramiteActualizarEstado): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}/estado`, dto);
    }

    listarNotas(tramiteId: number): Observable<NotaTramite[]> {
        return this.http
            .get<RespuestaApi<NotaTramite[]>>(`${this.base}/${tramiteId}/notas`)
            .pipe(map(r => r.data));
    }

    crearNota(tramiteId: number, dto: NotaTramiteCrear): Observable<NotaTramite> {
        return this.http
            .post<RespuestaApi<NotaTramite>>(`${this.base}/${tramiteId}/notas`, dto)
            .pipe(map(r => r.data));
    }

    eliminarNota(notaId: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/notas/${notaId}`);
    }
}

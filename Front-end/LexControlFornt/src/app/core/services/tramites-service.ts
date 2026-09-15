import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    Tramite,
    TramiteCrear,
    TramiteDetalle,
    TramiteActualizarEstado
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
}

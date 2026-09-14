import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    Audiencia,
    AudienciaCrear,
    AudienciaDetalle,
    AudienciaResultado
} from '../models/audiencia.model';

@Injectable({ providedIn: 'root' })
export class AudienciasService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/audiencias`;

    listar(filtros: {
        expedienteId?: number;
        fechaInicio?: string;
        fechaFin?: string;
        estadoId?: number;
        tipoId?: number;
    }): Observable<Audiencia[]> {
        let params = new HttpParams();
        Object.entries(filtros).forEach(([k, v]) => {
            if (v !== undefined && v !== null) params = params.set(k, String(v));
        });
        return this.http
            .get<RespuestaApi<Audiencia[]>>(this.base, { params })
            .pipe(map(r => r.data));
    }

    obtenerPorId(id: number): Observable<AudienciaDetalle> {
        return this.http
            .get<RespuestaApi<AudienciaDetalle>>(`${this.base}/${id}`)
            .pipe(map(r => r.data));
    }

    crear(dto: AudienciaCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(this.base, dto)
            .pipe(map(r => r.data));
    }

    registrarResultado(id: number, dto: AudienciaResultado): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}/resultado`, dto);
    }

    proximas(dias: number = 30): Observable<Audiencia[]> {
        return this.http
            .get<RespuestaApi<Audiencia[]>>(`${this.base}/proximas`, {
                params: new HttpParams().set('dias', String(dias))
            })
            .pipe(map(r => r.data));
    }
}

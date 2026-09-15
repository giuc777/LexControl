import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    Diligencia,
    DiligenciaDetalle,
    DiligenciaCrear,
    DiligenciaActualizar
} from '../models/diligencia.model';

@Injectable({ providedIn: 'root' })
export class DiligenciasService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/diligencias`;

    listar(filtros: {
        expedienteId?: number;
        clienteId?: number;
        tipoId?: number;
        estadoId?: number;
        usuarioId?: number;
        fechaInicio?: string;
        fechaFin?: string;
    } = {}): Observable<Diligencia[]> {
        let params = new HttpParams();
        Object.entries(filtros).forEach(([k, v]) => {
            if (v !== undefined && v !== null) params = params.set(k, String(v));
        });
        return this.http
            .get<RespuestaApi<Diligencia[]>>(this.base, { params })
            .pipe(map(r => r.data));
    }

    obtenerPorId(id: number): Observable<DiligenciaDetalle> {
        return this.http
            .get<RespuestaApi<DiligenciaDetalle>>(`${this.base}/${id}`)
            .pipe(map(r => r.data));
    }

    crear(dto: DiligenciaCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(this.base, dto)
            .pipe(map(r => r.data));
    }

    actualizar(id: number, dto: DiligenciaActualizar): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}`, dto);
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    ExpedienteActualizarDto,
    ExpedienteCrearDto,
    ExpedienteDetalle,
    ExpedienteEstadoDto,
    ExpedienteLista,
    NotaExpediente,
    NotaExpedienteActualizarDto,
    NotaExpedienteCrearDto,
    ParteProcesal,
    ParteProcesalCrearDto
} from '../models/expediente.model';

/* Servicio HTTP del modulo Expedientes. Consume los endpoints de
   ExpedientesController.cs y los endpoints anidados de partes, notas. */
@Injectable({ providedIn: 'root' })
export class ExpedientesService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/expedientes`;

    /* ── Expedientes ─────────────────────────────────────────── */

    listar(filtros: {
        ramaId?: number | null;
        estadoId?: number | null;
        clienteId?: number | null;
        abogadoId?: number | null;
        noExpediente?: string | null;
        pagina?: number;
        tamanioPagina?: number;
    }): Observable<{ expedientes: ExpedienteLista[]; total: number }> {
        let params = new HttpParams();
        if (filtros.ramaId != null) params = params.set('ramaId', String(filtros.ramaId));
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.clienteId != null) params = params.set('clienteId', String(filtros.clienteId));
        if (filtros.abogadoId != null) params = params.set('abogadoId', String(filtros.abogadoId));
        if (filtros.noExpediente) params = params.set('noExpediente', filtros.noExpediente);
        params = params.set('pagina', String(filtros.pagina ?? 1));
        params = params.set('tamanioPagina', String(filtros.tamanioPagina ?? 7));

        return this.http
            .get<RespuestaApi<ExpedienteLista[]>>(this.base, { params, observe: 'response' })
            .pipe(
                map(resp => ({
                    expedientes: resp.body?.data ?? [],
                    total: Number(resp.headers.get('X-Total-Count') ?? 0)
                }))
            );
    }

    obtenerPorId(id: number): Observable<ExpedienteDetalle> {
        return this.http
            .get<RespuestaApi<ExpedienteDetalle>>(`${this.base}/${id}`)
            .pipe(map(r => r.data));
    }

    crear(dto: ExpedienteCrearDto): Observable<ExpedienteDetalle> {
        return this.http
            .post<RespuestaApi<ExpedienteDetalle>>(this.base, dto)
            .pipe(map(r => r.data));
    }

    actualizar(id: number, dto: ExpedienteActualizarDto): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}`, dto);
    }

    cambiarEstado(id: number, dto: ExpedienteEstadoDto): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}/estado`, dto);
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }

    /* ── Partes procesales ───────────────────────────────────── */

    listarPartes(expedienteId: number): Observable<ParteProcesal[]> {
        return this.http
            .get<RespuestaApi<ParteProcesal[]>>(`${this.base}/${expedienteId}/partes`)
            .pipe(map(r => r.data));
    }

    crearParte(expedienteId: number, dto: ParteProcesalCrearDto): Observable<ParteProcesal> {
        return this.http
            .post<RespuestaApi<ParteProcesal>>(`${this.base}/${expedienteId}/partes`, dto)
            .pipe(map(r => r.data));
    }

    eliminarParte(parteId: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/partes/${parteId}`);
    }

    /* ── Notas ───────────────────────────────────────────────── */

    listarNotas(expedienteId: number): Observable<NotaExpediente[]> {
        return this.http
            .get<RespuestaApi<NotaExpediente[]>>(`${this.base}/${expedienteId}/notas`)
            .pipe(map(r => r.data));
    }

    crearNota(expedienteId: number, dto: NotaExpedienteCrearDto): Observable<NotaExpediente> {
        return this.http
            .post<RespuestaApi<NotaExpediente>>(`${this.base}/${expedienteId}/notas`, dto)
            .pipe(map(r => r.data));
    }

    actualizarNota(notaId: number, dto: NotaExpedienteActualizarDto): Observable<void> {
        return this.http.put<void>(`${this.base}/notas/${notaId}`, dto);
    }

    eliminarNota(notaId: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/notas/${notaId}`);
    }
}

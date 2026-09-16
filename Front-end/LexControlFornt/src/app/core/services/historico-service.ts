import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import { HistoricoExpediente } from '../models/historico.model';

/* Servicio HTTP del módulo Histórico Legal.
   Consume GET /api/historico del HistoricoController.cs. */
@Injectable({ providedIn: 'root' })
export class HistoricoService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/historico`;

    listar(filtros: {
        clienteId?: number | null;
        ramaId?: number | null;
        usuarioId?: number | null;
        busqueda?: string | null;
        fechaInicio?: string | null;
        fechaFin?: string | null;
    }): Observable<HistoricoExpediente[]> {
        let params = new HttpParams();
        if (filtros.clienteId) params = params.set('clienteId', filtros.clienteId);
        if (filtros.ramaId) params = params.set('ramaId', filtros.ramaId);
        if (filtros.usuarioId) params = params.set('usuarioId', filtros.usuarioId);
        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);

        return this.http
            .get<RespuestaApi<HistoricoExpediente[]>>(this.base, { params })
            .pipe(map(r => r.data ?? []));
    }
}

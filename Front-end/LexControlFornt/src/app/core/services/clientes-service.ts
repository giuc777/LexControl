import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    ClienteActualizarDto,
    ClienteDetalle,
    ClienteEstadisticas,
    ClienteExpediente,
    ClienteGuardarDto,
    ClienteLista
} from '../models/cliente.model';

/* Servicio HTTP del módulo Clientes. Consume los 7 endpoints de
   ClientesController.cs. El header X-Total-Count se lee para la
   paginación server-side. */
@Injectable({ providedIn: 'root' })
export class ClientesService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/api/clientes`;

    listar(filtros: {
        filtroNombre?: string | null;
        filtroEstado?: boolean | null;
        filtroTipo?: string | null;
        pagina?: number;
        tamanioPagina?: number;
    }): Observable<{ clientes: ClienteLista[]; total: number }> {
        let params = new HttpParams();
        if (filtros.filtroNombre) params = params.set('filtroNombre', filtros.filtroNombre);
        if (filtros.filtroEstado !== null && filtros.filtroEstado !== undefined) {
            params = params.set('filtroEstado', String(filtros.filtroEstado));
        }
        if (filtros.filtroTipo) params = params.set('filtroTipo', filtros.filtroTipo);
        params = params.set('pagina', String(filtros.pagina ?? 1));
        params = params.set('tamanioPagina', String(filtros.tamanioPagina ?? 20));

        return this.http
            .get<RespuestaApi<ClienteLista[]>>(this.baseUrl, { params, observe: 'response' })
            .pipe(
                map(resp => ({
                    clientes: resp.body?.data ?? [],
                    total: Number(resp.headers.get('X-Total-Count') ?? 0)
                }))
            );
    }

    estadisticas(): Observable<ClienteEstadisticas> {
        return this.http
            .get<RespuestaApi<ClienteEstadisticas>>(`${this.baseUrl}/estadisticas`)
            .pipe(map(r => r.data));
    }

    obtenerPorId(id: number): Observable<ClienteDetalle> {
        return this.http
            .get<RespuestaApi<ClienteDetalle>>(`${this.baseUrl}/${id}`)
            .pipe(map(r => r.data));
    }

    obtenerExpedientes(id: number): Observable<ClienteExpediente[]> {
        return this.http
            .get<RespuestaApi<ClienteExpediente[]>>(`${this.baseUrl}/${id}/expedientes`)
            .pipe(map(r => r.data));
    }

    crear(datos: ClienteGuardarDto): Observable<ClienteLista> {
        return this.http
            .post<RespuestaApi<ClienteLista>>(this.baseUrl, datos)
            .pipe(map(r => r.data));
    }

    actualizar(id: number, datos: ClienteActualizarDto): Observable<ClienteLista> {
        return this.http
            .put<RespuestaApi<ClienteLista>>(`${this.baseUrl}/${id}`, datos)
            .pipe(map(r => r.data));
    }

    cambiarEstado(id: number, activo: boolean): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}/estado`, { activo });
    }
}

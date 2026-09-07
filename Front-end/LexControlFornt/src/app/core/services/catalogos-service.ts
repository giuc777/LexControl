import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    CatalogoCrearDto,
    CatalogoEstadoDto,
    CatalogoItem,
    JuzgadoCrearDto,
    JuzgadoItem
} from '../models/catalogo.model';

/* Servicio HTTP del módulo Mantenimiento. Consume los endpoints de
   CatalogosController.cs para CRUD de catálogos del sistema. */
@Injectable({ providedIn: 'root' })
export class CatalogosService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/catalogos`;

    /* ── Catálogos estándar ──────────────────────────────────── */

    buscarCatalogo(
        tabla: string,
        filtros: {
            busqueda?: string | null;
            incluirInactivos?: boolean;
            pagina?: number;
            tamanoPagina?: number;
        } = {}
    ): Observable<{ items: CatalogoItem[]; total: number }> {
        let params = new HttpParams();
        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        if (filtros.incluirInactivos) params = params.set('incluirInactivos', 'true');
        params = params.set('pagina', String(filtros.pagina ?? 1));
        params = params.set('tamanoPagina', String(filtros.tamanoPagina ?? 50));

        return this.http
            .get<RespuestaApi<CatalogoItem[]>>(`${this.base}/${tabla}`, {
                params,
                observe: 'response'
            })
            .pipe(
                map(resp => ({
                    items: resp.body?.data ?? [],
                    total: Number(resp.headers.get('X-Total-Count') ?? 0)
                }))
            );
    }

    obtenerCatalogoPorId(tabla: string, id: number): Observable<CatalogoItem> {
        return this.http
            .get<RespuestaApi<CatalogoItem>>(`${this.base}/${tabla}/${id}`)
            .pipe(map(r => r.data));
    }

    insertarCatalogo(tabla: string, dto: CatalogoCrearDto): Observable<CatalogoItem> {
        return this.http
            .post<RespuestaApi<CatalogoItem>>(`${this.base}/${tabla}`, dto)
            .pipe(map(r => r.data));
    }

    actualizarCatalogo(tabla: string, id: number, dto: CatalogoCrearDto): Observable<CatalogoItem> {
        return this.http
            .put<RespuestaApi<CatalogoItem>>(`${this.base}/${tabla}/${id}`, dto)
            .pipe(map(r => r.data));
    }

    cambiarEstadoCatalogo(tabla: string, id: number, dto: CatalogoEstadoDto): Observable<void> {
        return this.http.put<void>(`${this.base}/${tabla}/${id}/estado`, dto);
    }

    /* ── Juzgados (tabla con FKs) ────────────────────────────── */

    buscarJuzgados(filtros: {
        busqueda?: string | null;
        incluirInactivos?: boolean;
        pagina?: number;
        tamanoPagina?: number;
    } = {}): Observable<{ items: JuzgadoItem[]; total: number }> {
        let params = new HttpParams();
        if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
        if (filtros.incluirInactivos) params = params.set('incluirInactivos', 'true');
        params = params.set('pagina', String(filtros.pagina ?? 1));
        params = params.set('tamanoPagina', String(filtros.tamanoPagina ?? 50));

        return this.http
            .get<RespuestaApi<JuzgadoItem[]>>(`${this.base}/juzgados`, {
                params,
                observe: 'response'
            })
            .pipe(
                map(resp => ({
                    items: resp.body?.data ?? [],
                    total: Number(resp.headers.get('X-Total-Count') ?? 0)
                }))
            );
    }

    obtenerJuzgadoPorId(id: number): Observable<JuzgadoItem> {
        return this.http
            .get<RespuestaApi<JuzgadoItem>>(`${this.base}/juzgados/${id}`)
            .pipe(map(r => r.data));
    }

    insertarJuzgado(dto: JuzgadoCrearDto): Observable<JuzgadoItem> {
        return this.http
            .post<RespuestaApi<JuzgadoItem>>(`${this.base}/juzgados`, dto)
            .pipe(map(r => r.data));
    }

    actualizarJuzgado(id: number, dto: JuzgadoCrearDto): Observable<JuzgadoItem> {
        return this.http
            .put<RespuestaApi<JuzgadoItem>>(`${this.base}/juzgados/${id}`, dto)
            .pipe(map(r => r.data));
    }

    cambiarEstadoJuzgado(id: number, dto: CatalogoEstadoDto): Observable<void> {
        return this.http.put<void>(`${this.base}/juzgados/${id}/estado`, dto);
    }
}

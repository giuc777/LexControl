import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import { BusquedaResultado } from '../models/busqueda.model';

@Injectable({ providedIn: 'root' })
export class BuscarService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/buscar`;

    private readonly vacio: BusquedaResultado = {
        expedientes: [], clientes: [], audiencias: [],
        tramites: [], notificaciones: [], diligencias: []
    };

    buscar(query: string): Observable<BusquedaResultado> {
        const params = new HttpParams().set('q', query);
        return this.http
            .get<RespuestaApi<BusquedaResultado>>(this.base, { params })
            .pipe(
                map(r => r.data),
                catchError(() => of(this.vacio))
            );
    }
}

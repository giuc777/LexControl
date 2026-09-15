import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import { Evento, EventoCrear, EventoAudienciaCrear } from '../models/evento.model';

@Injectable({ providedIn: 'root' })
export class EventosService {
    private readonly http = inject(HttpClient);
    private readonly base = `${environment.apiBaseUrl}/api/eventos`;

    obtenerDelDia(fecha: string): Observable<Evento[]> {
        const params = new HttpParams().set('fecha', fecha);
        return this.http
            .get<RespuestaApi<Evento[]>>(`${this.base}/dia`, { params })
            .pipe(map(r => r.data));
    }

    crear(dto: EventoCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(this.base, dto)
            .pipe(map(r => r.data));
    }

    crearAudiencia(dto: EventoAudienciaCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(`${this.base}/audiencia`, dto)
            .pipe(map(r => r.data));
    }
}

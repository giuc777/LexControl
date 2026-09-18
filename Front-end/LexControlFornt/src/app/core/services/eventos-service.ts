import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';

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
            .pipe(
                map(r => r.data),
                catchError(error => {
                    console.error('Error obteniendo eventos del día:', error);
                    return of([]);
                })
            );
    }

    obtenerDeLaSemana(fechaInicio: string, fechaFin: string): Observable<Evento[]> {
        const params = new HttpParams()
            .set('fechaInicio', fechaInicio)
            .set('fechaFin', fechaFin);
        return this.http
            .get<RespuestaApi<Evento[]>>(`${this.base}/semana`, { params })
            .pipe(
                map(r => r.data),
                catchError(error => {
                    console.error('Error obteniendo eventos de la semana:', error);
                    return of([]);
                })
            );
    }

    crear(dto: EventoCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(this.base, dto)
            .pipe(
                map(r => r.data),
                catchError(error => {
                    console.error('Error creando evento:', error);
                    throw error;
                })
            );
    }

    crearAudiencia(dto: EventoAudienciaCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(`${this.base}/audiencia`, dto)
            .pipe(
                map(r => r.data),
                catchError(error => {
                    console.error('Error creando audiencia:', error);
                    throw error;
                })
            );
    }
}

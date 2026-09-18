import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import { ToastService } from '../../layout/toast/toast-service';
import {
    NotificacionActualizar,
    NotificacionAtender,
    NotificacionCrear,
    NotificacionDetalle,
    NotificacionDuplicado,
    NotificacionLista,
    NotificacionPdfResponse
} from '../models/notificacion.model';

/* Servicio HTTP del modulo Notificaciones OJ. */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
    private readonly http = inject(HttpClient);
    private readonly toast = inject(ToastService);
    private readonly base = `${environment.apiBaseUrl}/api/notificaciones`;

    listar(filtros: {
        expedienteId?: number | null;
        estadoId?: number | null;
        tipoId?: number | null;
        juzgadoId?: number | null;
        fechaInicio?: string | null;
        fechaFin?: string | null;
    } = {}): Observable<NotificacionLista[]> {
        let params = new HttpParams();
        if (filtros.expedienteId != null) params = params.set('expedienteId', String(filtros.expedienteId));
        if (filtros.estadoId != null) params = params.set('estadoId', String(filtros.estadoId));
        if (filtros.tipoId != null) params = params.set('tipoId', String(filtros.tipoId));
        if (filtros.juzgadoId != null) params = params.set('juzgadoId', String(filtros.juzgadoId));
        if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
        if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);

        return this.http
            .get<RespuestaApi<NotificacionLista[]>>(this.base, { params })
            .pipe(map(r => r.data));
    }

    obtenerPorId(id: number): Observable<NotificacionDetalle> {
        return this.http
            .get<RespuestaApi<NotificacionDetalle>>(`${this.base}/${id}`)
            .pipe(map(r => r.data));
    }

    crear(dto: NotificacionCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(this.base, dto)
            .pipe(map(r => r.data));
    }

    actualizar(id: number, dto: NotificacionActualizar): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}`, dto);
    }

    atender(id: number, dto: NotificacionAtender): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}/atender`, dto);
    }

    /* Verifica duplicados de una notificación no atendida. */
    verificarDuplicado(dto: {
        expedienteId: number;
        numeroResolucion?: string | null;
        numeroExpedienteOj?: string | null;
    }): Observable<NotificacionDuplicado[]> {
        return this.http
            .post<RespuestaApi<NotificacionDuplicado[]>>(`${this.base}/verificar-duplicado`, dto)
            .pipe(map(r => r.data));
    }

    /* Sube el PDF asociado a una notificación existente. */
    subirPdf(id: number, archivo: File, descripcion: string | null = null): Observable<NotificacionPdfResponse> {
        const formData = new FormData();
        formData.append('file', archivo);
        if (descripcion) formData.append('descripcion', descripcion);

        return this.http
            .post<RespuestaApi<NotificacionPdfResponse>>(`${this.base}/${id}/pdf`, formData)
            .pipe(map(r => r.data));
    }

    /* URL de vista previa inline del PDF adjunto (resuelta por ID). */
    verPdf(id: number): string {
        return `${this.base}/${id}/pdf/preview`;
    }

    /* URL de descarga del PDF adjunto (resuelta por ID). */
    descargarPdfUrl(id: number): string {
        return `${this.base}/${id}/pdf/download`;
    }

    /* Obtiene el PDF adjunto como blob (pasa por el interceptor con JWT). */
    descargarPdfBlob(id: number): Observable<Blob> {
        return this.http.get(this.descargarPdfUrl(id), { responseType: 'blob' });
    }

    /* Descarga el PDF adjunto y lo guarda mediante el navegador. */
    descargarPdf(id: number, nombreArchivo = 'Documento_adjunto.pdf'): void {
        this.descargarPdfBlob(id).subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = nombreArchivo;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            },
            error: () => this.toast.mostrar('No se pudo descargar el documento adjunto.')
        });
    }

    /* Cuenta notificaciones pendientes (no atendidas) para el badge del topbar. */
    contarPendientes(): Observable<number> {
        return this.http
            .get<RespuestaApi<number>>(`${this.base}/pendientes/count`)
            .pipe(
                map(r => r.data),
                catchError(() => of(0))
            );
    }
}

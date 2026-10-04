import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import { DocumentoUploadResponse } from '../models/expediente.model';
import {
    Tramite,
    TramiteCrear,
    TramiteDetalle,
    TramiteActualizarEstado,
    TramiteActualizar,
    NotaTramite,
    NotaTramiteCrear,
    DocTramite
} from '../models/tramite.model';
import { ToastService } from '../../layout/toast/toast-service';

@Injectable({ providedIn: 'root' })
export class TramitesService {
    private readonly http = inject(HttpClient);
    private readonly toast = inject(ToastService);
    private readonly base = `${environment.apiBaseUrl}/api/tramites`;

    listar(filtros: {
        expedienteId?: number;
        estadoId?: number;
        tipoId?: number;
        fechaInicio?: string;
        fechaFin?: string;
    }): Observable<Tramite[]> {
        let params = new HttpParams();
        Object.entries(filtros).forEach(([k, v]) => {
            if (v !== undefined && v !== null) params = params.set(k, String(v));
        });
        return this.http
            .get<RespuestaApi<Tramite[]>>(this.base, { params })
            .pipe(map(r => r.data));
    }

    obtenerPorId(id: number): Observable<TramiteDetalle> {
        return this.http
            .get<RespuestaApi<TramiteDetalle>>(`${this.base}/${id}`)
            .pipe(map(r => r.data));
    }

    crear(dto: TramiteCrear): Observable<number> {
        return this.http
            .post<RespuestaApi<number>>(this.base, dto)
            .pipe(map(r => r.data));
    }

    actualizarEstado(id: number, dto: TramiteActualizarEstado): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}/estado`, dto);
    }

    actualizar(id: number, dto: TramiteActualizar): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}`, dto);
    }

    listarNotas(tramiteId: number): Observable<NotaTramite[]> {
        return this.http
            .get<RespuestaApi<NotaTramite[]>>(`${this.base}/${tramiteId}/notas`)
            .pipe(map(r => r.data));
    }

    crearNota(tramiteId: number, dto: NotaTramiteCrear): Observable<NotaTramite> {
        return this.http
            .post<RespuestaApi<NotaTramite>>(`${this.base}/${tramiteId}/notas`, dto)
            .pipe(map(r => r.data));
    }

    eliminarNota(notaId: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/notas/${notaId}`);
    }

    listarDocumentos(tramiteId: number): Observable<DocTramite[]> {
        return this.http
            .get<RespuestaApi<DocTramite[]>>(`${this.base}/${tramiteId}/documentos`)
            .pipe(map(r => r.data));
    }

    subirDocumento(tramiteId: number, archivo: File, descripcion: string | null): Observable<DocumentoUploadResponse> {
        const formData = new FormData();
        formData.append('file', archivo);
        if (descripcion) formData.append('descripcion', descripcion);

        return this.http
            .post<RespuestaApi<DocumentoUploadResponse>>(`${this.base}/${tramiteId}/documentos/upload`, formData)
            .pipe(map(r => r.data));
    }

    /** URL de vista previa inline (resuelta por ID en el backend). */
    verDocumento(documentoId: number): string {
        return `${this.base}/documentos/${documentoId}/preview`;
    }

    /** URL de descarga (resuelta por ID en el backend). */
    descargarUrl(documentoId: number): string {
        return `${this.base}/documentos/${documentoId}/download`;
    }

    /** Descarga el archivo y lo guarda mediante el navegador. */
    descargarDocumento(documentoId: number, nombreArchivo?: string): void {
        this.http.get(this.descargarUrl(documentoId), { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = nombreArchivo ?? 'archivo';
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            },
            error: () => this.toast.mostrar('No se pudo descargar el archivo.', 3000)
        });
    }

    eliminarDocumento(documentoId: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/documentos/${documentoId}`);
    }
}

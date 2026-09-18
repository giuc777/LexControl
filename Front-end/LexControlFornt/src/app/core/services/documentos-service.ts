import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import { DocExpediente, DocumentoUploadResponse } from '../models/expediente.model';
import { ToastService } from '../../layout/toast/toast-service';

/* Servicio HTTP para documentos de expedientes. Consume los endpoints de
   DocumentosController.cs. La descarga/vista previa se hace por ID, de modo
   que el backend resuelve la ruta en el servidor (no se exponen rutas). */
@Injectable({ providedIn: 'root' })
export class DocumentosService {
    private readonly http = inject(HttpClient);
    private readonly toast = inject(ToastService);
    private readonly expedientesBase = `${environment.apiBaseUrl}/api/expedientes`;
    private readonly documentosBase = `${environment.apiBaseUrl}/api/documentos`;

    listar(expedienteId: number): Observable<DocExpediente[]> {
        return this.http
            .get<RespuestaApi<DocExpediente[]>>(`${this.expedientesBase}/${expedienteId}/documentos`)
            .pipe(map(r => r.data));
    }

    subir(expedienteId: number, archivo: File, descripcion: string | null): Observable<DocumentoUploadResponse> {
        const formData = new FormData();
        formData.append('file', archivo);
        formData.append('expedienteId', String(expedienteId));
        if (descripcion) formData.append('descripcion', descripcion);

        return this.http
            .post<DocumentoUploadResponse>(`${this.documentosBase}/upload`, formData);
    }

    /** URL de vista previa inline (resuelta por ID en el backend). */
    ver(documentoId: number): string {
        return `${this.documentosBase}/${documentoId}/preview`;
    }

    /** URL de descarga (resuelta por ID en el backend). */
    descargarUrl(documentoId: number): string {
        return `${this.documentosBase}/${documentoId}/download`;
    }

    /** Obtiene el archivo como blob (pasa por el interceptor con JWT). */
    descargarBlob(documentoId: number): Observable<Blob> {
        return this.http.get(this.descargarUrl(documentoId), { responseType: 'blob' });
    }

    /** Descarga el archivo y lo guarda mediante el navegador. */
    descargar(documentoId: number, nombreArchivo?: string): void {
        this.descargarBlob(documentoId).subscribe({
            next: blob => this.guardarBlob(blob, nombreArchivo),
            error: () => this.toast.mostrar('No se pudo descargar el archivo.')
        });
    }

    eliminar(documentoId: number): Observable<void> {
        return this.http.delete<void>(`${this.documentosBase}/${documentoId}`);
    }

    private guardarBlob(blob: Blob, nombreArchivo?: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo ?? 'archivo';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

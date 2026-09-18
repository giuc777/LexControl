import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import { DocExpediente, DocumentoUploadResponse } from '../models/expediente.model';

/* Servicio HTTP para documentos de expedientes. Consume los endpoints de
   DocumentosController.cs (upload/download/delete/preview) y el endpoint anidado
   de ExpedientesController.cs (listar). */
@Injectable({ providedIn: 'root' })
export class DocumentosService {
    private readonly http = inject(HttpClient);
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

    ver(rutaArchivo: string): string {
        return `${this.documentosBase}/preview/${encodeURIComponent(rutaArchivo)}`;
    }

    descargarBlob(rutaArchivo: string): Observable<Blob> {
        const url = `${this.documentosBase}/download/${encodeURIComponent(rutaArchivo)}`;
        return this.http.get(url, { responseType: 'blob' });
    }

    eliminar(documentoId: number): Observable<void> {
        return this.http.delete<void>(`${this.documentosBase}/${documentoId}`);
    }

    /** Descarga un archivo y lo guarda como descarga del navegador. */
    descargar(rutaArchivo: string, nombreArchivo?: string): void {
        this.descargarBlob(rutaArchivo).subscribe(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = nombreArchivo ?? rutaArchivo.split('/').pop() ?? 'archivo';
            a.click();
            URL.revokeObjectURL(blobUrl);
        });
    }
}

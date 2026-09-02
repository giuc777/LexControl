import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import { DocExpediente, DocumentoUploadResponse } from '../models/expediente.model';

/* Servicio HTTP para documentos de expedientes. Consume los endpoints de
   DocumentosController.cs (upload/download/delete) y el endpoint anidado
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

    descargar(rutaArchivo: string): string {
        return `${this.documentosBase}/download/${encodeURIComponent(rutaArchivo)}`;
    }

    eliminar(documentoId: number): Observable<void> {
        return this.http.delete<void>(`${this.documentosBase}/${documentoId}`);
    }
}

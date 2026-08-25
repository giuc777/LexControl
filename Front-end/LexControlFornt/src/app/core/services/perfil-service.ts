import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import { CambioContrasenaDto, Perfil, PerfilActualizarDto } from '../models/usuario.model';

/* Perfil del usuario autenticado (api.md §4.2).
   Las peticiones PUT devuelven 204 sin cuerpo; los GET traen el sobre estándar. */
@Injectable({ providedIn: 'root' })
export class PerfilService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/api/perfil`;

    obtener(): Observable<Perfil> {
        return this.http
            .get<RespuestaApi<Perfil>>(this.baseUrl)
            .pipe(map(respuesta => respuesta.data));
    }

    actualizar(datos: PerfilActualizarDto): Observable<void> {
        return this.http.put<void>(this.baseUrl, datos);
    }

    cambiarContrasena(datos: CambioContrasenaDto): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/contrasena`, datos);
    }
}

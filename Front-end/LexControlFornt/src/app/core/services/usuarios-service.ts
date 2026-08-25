import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../api/respuesta-api';
import {
    RolCatalogo,
    UsuarioFiltros,
    UsuarioGuardarDto,
    UsuarioLista
} from '../models/usuario.model';

/* Gestión de usuarios del sistema — solo rol Administrador (api.md §4.3).
   Borrado lógico vía PUT /{id}/estado; desbloqueo tras intentos fallidos.
   POST responde 201 con el usuario creado · PUT /{id} responde 200 ·
   estado y desbloquear responden 204. */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiBaseUrl}/api/usuarios`;

    listar(filtros?: UsuarioFiltros): Observable<UsuarioLista[]> {
        let params = new HttpParams();
        if (filtros?.filtroNombre) params = params.set('filtroNombre', filtros.filtroNombre);
        if (filtros?.rolId != null) params = params.set('rolId', String(filtros.rolId));
        if (filtros?.activo != null) params = params.set('activo', filtros.activo ? 'true' : 'false');

        return this.http
            .get<RespuestaApi<UsuarioLista[]>>(this.baseUrl, { params })
            .pipe(map(respuesta => respuesta.data));
    }

    roles(): Observable<RolCatalogo[]> {
        return this.http
            .get<RespuestaApi<RolCatalogo[]>>(`${this.baseUrl}/roles`)
            .pipe(map(respuesta => respuesta.data));
    }

    crear(datos: UsuarioGuardarDto): Observable<UsuarioLista> {
        return this.http
            .post<RespuestaApi<UsuarioLista>>(this.baseUrl, datos)
            .pipe(map(respuesta => respuesta.data));
    }

    actualizar(id: number, datos: UsuarioGuardarDto): Observable<UsuarioLista> {
        return this.http
            .put<RespuestaApi<UsuarioLista>>(`${this.baseUrl}/${id}`, datos)
            .pipe(map(respuesta => respuesta.data));
    }

    cambiarEstado(id: number, activo: boolean): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}/estado`, { activo });
    }

    desbloquear(id: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${id}/desbloquear`, null);
    }
}

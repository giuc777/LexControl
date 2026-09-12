import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi, SesionRespuesta } from '../api/respuesta-api';

export interface SesionUsuario {
    usuarioId: number;
    usuario: string;
    nombre: string;
    rolId: number;
    rol: string;
    token: string;
    refreshToken: string;
    expiracion: string;   // ISO 8601 UTC (api.md §4.1)
}

const CLAVE_TOKEN = 'lexcontrol_token';
const CLAVE_REFRESH = 'lexcontrol_refresh';
const CLAVE_USUARIO_ID = 'lexcontrol_usuarioId';
const CLAVE_USUARIO = 'lexcontrol_usuario';
const CLAVE_NOMBRE = 'lexcontrol_nombre';
const CLAVE_ROL_ID = 'lexcontrol_rolId';
const CLAVE_ROL = 'lexcontrol_rol';
const CLAVE_EXPIRACION = 'lexcontrol_expiracion';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);

    private readonly _sesion = signal<SesionUsuario | null>(this.leerSesion());

    readonly sesion = this._sesion.asReadonly();
    readonly estaAutenticado = computed(() => this._sesion() !== null);
    readonly nombre = computed(() => this._sesion()?.nombre ?? '');
    readonly rol = computed(() => this._sesion()?.rol ?? '');
    readonly rolId = computed(() => this._sesion()?.rolId ?? 0);
    readonly token = computed(() => this._sesion()?.token ?? null);

    actualizarNombre(nombre: string): void {
        const sesion = this._sesion();
        if (!sesion) return;

        sessionStorage.setItem(CLAVE_NOMBRE, nombre);
        this._sesion.set({ ...sesion, nombre });
    }

    iniciarSesion(usuario: string, contrasena: string): Observable<SesionRespuesta> {
        return this.http
            .post<RespuestaApi<SesionRespuesta>>(`${environment.apiBaseUrl}/api/auth/login`, {
                usuario,
                contrasena
            })
            .pipe(
                map(respuesta => {
                    if (!respuesta.success) {
                        throw new Error(respuesta.error || 'No fue posible iniciar sesión.');
                    }

                    this.guardarSesion(respuesta.data);
                    return respuesta.data;
                })
            );
    }

    /* Refresca el par de tokens usando el refresh token.
       Retorna los nuevos datos de sesión o null si el refresh falló. */
    refrescar(): Observable<SesionUsuario | null> {
        const refresh = sessionStorage.getItem(CLAVE_REFRESH);
        if (!refresh) return new Observable<SesionUsuario | null>(obs => { obs.next(null); obs.complete(); });

        return this.http
            .post<RespuestaApi<SesionRespuesta>>(`${environment.apiBaseUrl}/api/auth/refresh`, {
                refreshToken: refresh
            })
            .pipe(
                map(respuesta => {
                    if (!respuesta.success) {
                        this.cerrarSesion();
                        return null;
                    }

                    this.guardarSesion(respuesta.data);
                    return this._sesion();
                })
            );
    }

    cerrarSesion(): void {
        this.limpiarStorage();
        this._sesion.set(null);
    }

    private guardarSesion(datos: SesionRespuesta): void {
        sessionStorage.setItem(CLAVE_TOKEN, datos.token);
        sessionStorage.setItem(CLAVE_REFRESH, datos.refreshToken);
        sessionStorage.setItem(CLAVE_USUARIO_ID, String(datos.usuarioId));
        sessionStorage.setItem(CLAVE_USUARIO, datos.usuario);
        sessionStorage.setItem(CLAVE_NOMBRE, datos.nombreCompleto);
        sessionStorage.setItem(CLAVE_ROL_ID, String(datos.rolId));
        sessionStorage.setItem(CLAVE_ROL, datos.rol);
        sessionStorage.setItem(CLAVE_EXPIRACION, datos.expiracion);

        this._sesion.set({
            usuarioId: datos.usuarioId,
            usuario: datos.usuario,
            nombre: datos.nombreCompleto,
            rolId: datos.rolId,
            rol: datos.rol,
            token: datos.token,
            refreshToken: datos.refreshToken,
            expiracion: datos.expiracion
        });
    }

    private leerSesion(): SesionUsuario | null {
        const token = sessionStorage.getItem(CLAVE_TOKEN);
        if (!token) return null;

        const expiracion = sessionStorage.getItem(CLAVE_EXPIRACION) ?? '';
        if (!expiracion || new Date(expiracion).getTime() <= Date.now()) {
            this.limpiarStorage();
            return null;
        }

        const usuario = sessionStorage.getItem(CLAVE_USUARIO);
        if (!usuario) return null;

        return {
            usuarioId: Number(sessionStorage.getItem(CLAVE_USUARIO_ID)) || 0,
            usuario,
            nombre: sessionStorage.getItem(CLAVE_NOMBRE) || usuario,
            rolId: Number(sessionStorage.getItem(CLAVE_ROL_ID)) || 0,
            rol: sessionStorage.getItem(CLAVE_ROL) || '',
            token,
            refreshToken: sessionStorage.getItem(CLAVE_REFRESH) || '',
            expiracion
        };
    }

    private limpiarStorage(): void {
        sessionStorage.removeItem(CLAVE_TOKEN);
        sessionStorage.removeItem(CLAVE_REFRESH);
        sessionStorage.removeItem(CLAVE_USUARIO_ID);
        sessionStorage.removeItem(CLAVE_USUARIO);
        sessionStorage.removeItem(CLAVE_NOMBRE);
        sessionStorage.removeItem(CLAVE_ROL_ID);
        sessionStorage.removeItem(CLAVE_ROL);
        sessionStorage.removeItem(CLAVE_EXPIRACION);
    }
}

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
    expiracion: string;   // ISO 8601 UTC (api.md §4.1)
}

const CLAVE_TOKEN = 'lexcontrol_token';
const CLAVE_USUARIO_ID = 'lexcontrol_usuarioId';
const CLAVE_USUARIO = 'lexcontrol_usuario';
const CLAVE_NOMBRE = 'lexcontrol_nombre';
const CLAVE_ROL_ID = 'lexcontrol_rolId';
const CLAVE_ROL = 'lexcontrol_rol';
const CLAVE_EXPIRACION = 'lexcontrol_expiracion';

/* Autenticación contra LexControlApi (agents.md §6.1):
   POST /api/auth/login devuelve el JWT y los datos de la sesión;
   el token vive solo en sessionStorage (nunca se loguea ni versiona). */
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

    /* Sincroniza el nombre mostrado en el topbar tras editar el perfil
       (PUT /api/perfil). Actualiza señal y sessionStorage. */
    actualizarNombre(nombre: string): void {
        const sesion = this._sesion();
        if (!sesion) return;

        sessionStorage.setItem(CLAVE_NOMBRE, nombre);
        this._sesion.set({ ...sesion, nombre });
    }

    /* Llama al backend y persiste la sesión al recibir el JWT.
       Los errores HTTP se propagan al componente para mostrar la alerta. */
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

    cerrarSesion(): void {
        this.limpiarStorage();
        this._sesion.set(null);
    }

    private guardarSesion(datos: SesionRespuesta): void {
        sessionStorage.setItem(CLAVE_TOKEN, datos.token);
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
            expiracion: datos.expiracion
        });
    }

    /* Reconstruye la sesión al cargar la app; descarta tokens vencidos. */
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
            expiracion
        };
    }

    private limpiarStorage(): void {
        sessionStorage.removeItem(CLAVE_TOKEN);
        sessionStorage.removeItem(CLAVE_USUARIO_ID);
        sessionStorage.removeItem(CLAVE_USUARIO);
        sessionStorage.removeItem(CLAVE_NOMBRE);
        sessionStorage.removeItem(CLAVE_ROL_ID);
        sessionStorage.removeItem(CLAVE_ROL);
        sessionStorage.removeItem(CLAVE_EXPIRACION);
    }
}

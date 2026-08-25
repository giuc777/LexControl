import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ToastService } from '../../layout/toast/toast-service';
import { RespuestaApi } from '../api/respuesta-api';
import { AuthService } from '../auth/auth-service';
import { ModuloPermiso, PermisosGuardarDto, RolConModulos } from '../models/permiso.model';

/* Registro de módulos y matriz de permisos por rol.
   Fuente de verdad: /api/permisos del backend (api.md §4.4); los defaults
   de abajo solo respaldan la pantalla si el API no responde (agents.md §6.2).
   Reglas fijas del backend: dashboard nunca oculto · al Administrador nunca
   se le quita ajustes. */

export type ModuloKey =
    | 'dashboard'
    | 'clientes'
    | 'expedientes'
    | 'audiencias'
    | 'tramites'
    | 'historico'
    | 'notificaciones'
    | 'mantenimiento'
    | 'reportes'
    | 'ajustes';

export interface ModuloDef {
    key: ModuloKey;
    label: string;
    ruta: string;
    icon: string;
}

export const MODULOS: readonly ModuloDef[] = [
    /* Íconos: paths fusionados de public/img/icons/*.svg (SVG Repo).
       Los módulos sin archivo propio (reportes y el logout/search/bell/menu del
       topbar) conservan los paths inline de Pototipo/js/layout.js.
       Audiencia_icon.svg se reserva para vistas de detalle futuras. */
    { key: 'dashboard', label: 'Dashboard', ruta: 'dashboard', icon: 'M13 15C13 14.0572 13 13.5858 13.2929 13.2929C13.5858 13 14.0572 13 15 13H17C17.9428 13 18.4142 13 18.7071 13.2929C19 13.5858 19 14.0572 19 15V17C19 17.9428 19 18.4142 18.7071 18.7071C18.4142 19 17.9428 19 17 19H15C14.0572 19 13.5858 19 13.2929 18.7071C13 18.4142 13 17.9428 13 17V15Z M13 7C13 6.05719 13 5.58579 13.2929 5.29289C13.5858 5 14.0572 5 15 5H17C17.9428 5 18.4142 5 18.7071 5.29289C19 5.58579 19 6.05719 19 7V9C19 9.94281 19 10.4142 18.7071 10.7071C18.4142 11 17.9428 11 17 11H15C14.0572 11 13.5858 11 13.2929 10.7071C13 10.4142 13 9.94281 13 9V7Z M5 15C5 14.0572 5 13.5858 5.29289 13.2929C5.58579 13 6.05719 13 7 13H9C9.94281 13 10.4142 13 10.7071 13.2929C11 13.5858 11 14.0572 11 15V17C11 17.9428 11 18.4142 10.7071 18.7071C10.4142 19 9.94281 19 9 19H7C6.05719 19 5.58579 19 5.29289 18.7071C5 18.4142 5 17.9428 5 17V15Z M5 7C5 6.05719 5 5.58579 5.29289 5.29289C5.58579 5 6.05719 5 7 5H9C9.94281 5 10.4142 5 10.7071 5.29289C11 5.58579 11 6.05719 11 7V9C11 9.94281 11 10.4142 10.7071 10.7071C10.4142 11 9.94281 11 9 11H7C6.05719 11 5.58579 11 5.29289 10.7071C5 10.4142 5 9.94281 5 9V7Z' },
    { key: 'clientes', label: 'Clientes', ruta: 'clientes', icon: 'M17.5 18H18.7687C19.2035 18 19.4209 18 19.5817 17.9473C20.1489 17.7612 20.5308 17.1231 20.498 16.4163C20.4887 16.216 20.42 15.9676 20.2825 15.4708C20.168 15.0574 20.1108 14.8507 20.0324 14.6767C19.761 14.0746 19.2766 13.6542 18.7165 13.5346C18.5546 13.5 18.3737 13.5 18.0118 13.5L15.5 13.5346M14.6899 11.6996C15.0858 11.892 15.5303 12 16 12C17.6569 12 19 10.6569 19 9C19 7.34315 17.6569 6 16 6C15.7295 6 15.4674 6.0358 15.2181 6.10291M13.5 8C13.5 10.2091 11.7091 12 9.5 12C7.29086 12 5.5 10.2091 5.5 8C5.5 5.79086 7.29086 4 9.5 4C11.7091 4 13.5 5.79086 13.5 8ZM6.81765 14H12.1824C12.6649 14 12.9061 14 13.1219 14.0461C13.8688 14.2056 14.5147 14.7661 14.8765 15.569C14.9811 15.8009 15.0574 16.0765 15.21 16.6278C15.3933 17.2901 15.485 17.6213 15.4974 17.8884C15.5411 18.8308 15.0318 19.6817 14.2756 19.9297C14.0613 20 13.7714 20 13.1916 20H5.80844C5.22864 20 4.93875 20 4.72441 19.9297C3.96818 19.6817 3.45888 18.8308 3.50261 17.8884C3.51501 17.6213 3.60668 17.2901 3.79003 16.6278C3.94262 16.0765 4.01891 15.8009 4.12346 15.569C4.4853 14.7661 5.13116 14.2056 5.87806 14.0461C6.09387 14 6.33513 14 6.81765 14Z' },
    { key: 'expedientes', label: 'Expedientes', ruta: 'expedientes', icon: 'M9.00004 5H17C17.5523 5 18 5.44772 18 6V19C18 19.5523 17.5523 20 17 20H7.00004C6.44776 20 6.00004 19.5523 6.00004 19V11M9.00004 5L9 9C9 10.1046 8.10457 11 7 11C5.89543 11 5 10.1046 5 9V5M9.00004 5C9.00004 4.44772 8.55228 4 8 4C7.44772 4 7 4.44772 7 5V9M11 9H15M10 12H15M9.00004 15H15' },
    { key: 'audiencias', label: 'Agenda', ruta: 'agenda', icon: 'M4 10V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V10M4 10V15M4 10H9M20 10V15M20 10H15M4 15V18C4 19.1046 4.89543 20 6 20H9M4 15H9M20 15V18C20 19.1046 19.1046 20 18 20H15M20 15H15M9 15H15M9 15V10M9 15V20M15 15V10M15 15V20M9 10H15M9 20H15M10 7H14' },
    { key: 'tramites', label: 'Trámites', ruta: 'tramites', icon: 'M5 4H17M5 8H13M5 12H9M5 16H8M5 20H11M16.4729 17.4525C17.046 16.8743 17.4 16.0785 17.4 15.2C17.4 13.4327 15.9673 12 14.2 12C12.4327 12 11 13.4327 11 15.2C11 16.9673 12.4327 18.4 14.2 18.4C15.0888 18.4 15.893 18.0376 16.4729 17.4525ZM16.4729 17.4525L19 20' },
    { key: 'historico', label: 'Histórico Legal', ruta: 'historico', icon: 'M4 12V9C4 8.44771 4.44772 8 5 8H9M4 12V17C4 17.5523 4.44772 18 5 18H19C19.5523 18 20 17.5523 20 17V12M4 12L11 13H13L20 12M20 12V9C20 8.44771 19.5523 8 19 8H15M9 8V7C9 6.44772 9.44772 6 10 6H14C14.5523 6 15 6.44772 15 7V8M9 8H15M11 14.5H13' },
    { key: 'notificaciones', label: 'Notificaciones OJ', ruta: 'notificaciones-oj', icon: 'M13.7143 17.25C13.7143 18.2165 12.9468 19 12 19C11.0532 19 10.2857 18.2165 10.2857 17.25M12 5V5C9.51472 5 7.5 7.01472 7.5 9.5V10.8079C7.5 11.5944 7.34024 12.3728 7.0304 13.0957L6.59739 14.1061C6.31459 14.7659 6.79862 15.5 7.51654 15.5H16.4835C17.2014 15.5 17.6854 14.7659 17.4026 14.1061L16.9696 13.0957C16.6598 12.3728 16.5 11.5944 16.5 10.8079V9.5C16.5 7.01472 14.4853 5 12 5V5ZM12 5V4' },
    { key: 'mantenimiento', label: 'Mantenimiento', ruta: 'mantenimiento', icon: 'M12 5H9C7.11438 5 6.17157 5 5.58579 5.58579C5 6.17157 5 7.11438 5 9V15C5 16.8856 5 17.8284 5.58579 18.4142C6.17157 19 7.11438 19 9 19H15C16.8856 19 17.8284 19 18.4142 18.4142C19 17.8284 19 16.8856 19 15V12M9.31899 12.6911L15.2486 6.82803C15.7216 6.36041 16.4744 6.33462 16.9782 6.76876C17.5331 7.24688 17.5723 8.09299 17.064 8.62034L11.2329 14.6702L9 15L9.31899 12.6911Z' },
    { key: 'reportes', label: 'Reportes', ruta: 'reportes', icon: 'M3 3v18h18M7 15v-4M12 15V8M17 15V5' },
    { key: 'ajustes', label: 'Ajustes', ruta: 'ajustes', icon: 'M11.7518 6.24359C12.983 5.01246 14.782 4.69543 16.3057 5.29249L13.5532 8.04496C13.2216 8.37659 13.2216 8.91425 13.5532 9.24588L14.7541 10.4468C15.0857 10.7784 15.6234 10.7784 15.955 10.4468L18.7075 7.69432C19.3046 9.21796 18.9875 11.017 17.7564 12.2482C16.5253 13.4793 14.7262 13.7963 13.2026 13.1993L7.89927 18.5026C7.23602 19.1658 6.16068 19.1658 5.49744 18.5026C4.83419 17.8393 4.83419 16.764 5.49744 16.1007L10.8007 10.7974C10.2037 9.2738 10.5207 7.47472 11.7518 6.24359Z' }
];

type MatrizPermisos = Record<string, boolean>;

function todosActivos(): MatrizPermisos {
    const m = {} as MatrizPermisos;
    for (const modulo of MODULOS) m[modulo.key] = true;
    return m;
}

function todosMenos(exceptuados: ModuloKey[]): MatrizPermisos {
    const m = todosActivos();
    for (const key of exceptuados) m[key] = false;
    return m;
}

/* Defaults por rol (api.md §4.4):
   - Administrador: acceso total.
   - Secretaria: todo excepto histórico legal y notificaciones OJ.
   - Abogado: todo excepto mantenimiento.
   Exportados: «Restaurar valores» en Ajustes los vuelve a enviar vía PUT. */
export const PERMISOS_DEFECTO: Record<string, MatrizPermisos> = {
    Administrador: todosActivos(),
    Secretaria: todosMenos(['historico', 'notificaciones']),
    Abogado: todosMenos(['mantenimiento'])
};

/* Claves de ícono que envía el backend en ModuloPermiso.icono (estilo Material)
   mapeadas a nuestros SVG (paths fusionados de public/img/icons). */
const ICONOS_API: Record<string, ModuloKey> = {
    dashboard: 'dashboard',
    people: 'clientes',
    folder: 'expedientes',
    event: 'audiencias',
    assignment: 'tramites',
    history: 'historico',
    notifications: 'notificaciones',
    settings: 'mantenimiento',
    'bar-chart': 'reportes',
    sliders: 'ajustes'
};

/* Resuelve el ícono SVG a partir de la clave que envía el backend en
   ModuloPermiso.icono ("dashboard", "people", "folder", ...). Acepta también
   la clave del módulo o su etiqueta; fallback al ícono del dashboard. */
export function iconoDe(clave: string): string {
    const key = ICONOS_API[clave] ?? clave;

    const modulo = MODULOS.find(m =>
        m.key === key || m.label.toLowerCase() === String(clave).toLowerCase()
    );
    return modulo?.icon ?? MODULOS[0].icon;
}

/* Copia de la matriz por defecto de un rol («Restaurar valores»). */
export function matrizDefectoDe(rol: string): Record<string, boolean> {
    const base = PERMISOS_DEFECTO[rol];
    return { ...(base ? { ...base } : todosActivos()) };
}

@Injectable({ providedIn: 'root' })
export class PermisosService {
    private readonly http = inject(HttpClient);
    private readonly auth = inject(AuthService);
    private readonly toast = inject(ToastService);

    private readonly baseUrl = `${environment.apiBaseUrl}/api/permisos`;

    /* Módulos visibles del rol autenticado; vacío hasta la primera carga. */
    private readonly _menu = signal<ModuloPermiso[] | null>(null);

    /* Menú listo para el sidebar: lo cargado del API o, mientras tanto,
       los defaults por rol (evita parpadear vacío al montar el shell). */
    readonly menu = computed<ModuloPermiso[]>(() => {
        const cargado = this._menu();
        if (cargado) return cargado;

        const rol = this.auth.rol();
        const defecto = PERMISOS_DEFECTO[rol] ?? todosActivos();
        return MODULOS.filter(m => defecto[m.key]).map((m, i) => ({
            clave: m.key,
            nombre: m.label,
            ruta: `/${m.ruta}`,
            icono: m.key,
            orden: i + 1,
            activo: true
        }));
    });

    /* true si ya se cargó el menú real del rol desde el API. */
    readonly menuCargado = computed(() => this._menu() !== null);

    tiene(clave: string): boolean {
        return this.menu().some(m => m.clave === clave && m.activo);
    }

    /* Carga los módulos visibles del rol autenticado (una sola vez por rol).
       Si el API falla, conserva los defaults para no romper la navegación. */
    cargarMenu(): Observable<boolean> {
        const rolId = this.auth.rolId();
        if (!rolId) return of(false);

        return this.http
            .get<RespuestaApi<ModuloPermiso[]>>(`${this.baseUrl}/${rolId}`)
            .pipe(
                map(respuesta => {
                    this._menu.set(this.ordenar(respuesta.data));
                    return true;
                }),
                catchError(() => {
                    this.toast.mostrar('No fue posible cargar los permisos del menú; se usan los valores por defecto.');
                    this._menu.set(null);
                    return of(false);
                })
            );
    }

    /* Fuerza la recarga (tras guardar cambios sobre el propio rol). */
    recargarMenu(): void {
        this._menu.set(null);
        this.cargarMenu().subscribe();
    }

    /* Matriz completa agrupada por rol — pantalla de administración (403 si
       el usuario no es Administrador). */
    obtenerMatriz(): Observable<RolConModulos[]> {
        return this.http
            .get<RespuestaApi<RolConModulos[]>>(this.baseUrl)
            .pipe(map(respuesta => respuesta.data));
    }

    /* Guarda la matriz completa de un rol: enviar siempre las 10 claves
       (toda clave omitida queda oculta según api.md §4.4). 204 al éxito. */
    guardarRol(rolId: number, modulos: Record<string, boolean>): Observable<void> {
        const cuerpo: PermisosGuardarDto = { modulos };
        return this.http.put<void>(`${this.baseUrl}/${rolId}`, cuerpo);
    }

    private ordenar(modulos: ModuloPermiso[]): ModuloPermiso[] {
        return [...modulos]
            .filter(m => m.activo)
            .sort((a, b) => a.orden - b.orden);
    }
}

/* Contratos de la matriz de permisos rol × módulo (api.md §4.4).
   Reglas fijas del backend: dashboard nunca oculto; al Administrador
   nunca se le puede quitar ajustes. */

/* Elemento de GET /api/permisos y GET /api/permisos/{rolId}. */
export interface ModuloPermiso {
    clave: string;
    nombre: string;
    ruta: string;
    icono: string;
    orden: number;
    activo: boolean;
}

/* Fila de GET /api/permisos (matriz completa, solo Administrador). */
export interface RolConModulos {
    rolId: number;
    rol: string;
    modulos: ModuloPermiso[];
}

/* Body de PUT /api/permisos/{rolId}: enviar siempre las 10 claves. */
export interface PermisosGuardarDto {
    modulos: Record<string, boolean>;
}

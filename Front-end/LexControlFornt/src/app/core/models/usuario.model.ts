/* Contratos del módulo de usuarios y perfil (api.md §4.2 y §4.3).
   Fechas en ISO 8601 UTC; el formateo local se hace en UI, no aquí. */

/* GET /api/perfil */
export interface Perfil {
    id: number;
    nombreCompleto: string;
    usuario: string;
    email: string;
    telefono: string;
    rolId: number;
    rol: string;
    activo: boolean;
}

/* PUT /api/perfil (telefono opcional, máx. 20) */
export interface PerfilActualizarDto {
    nombreCompleto: string;
    email: string;
    telefono?: string;
}

/* PUT /api/perfil/contrasena — política: 8+, un dígito y un especial. */
export interface CambioContrasenaDto {
    contrasenaActual: string;
    contrasenaNueva: string;
    confirmacion: string;
}

/* Elemento de GET /api/usuarios y detalle por id. */
export interface UsuarioLista {
    id: number;
    nombreCompleto: string;
    usuario: string;
    email: string;
    telefono: string;
    rolId: number;
    rol: string;
    activo: boolean;
    bloqueado: boolean;
    ultimoAcceso: string | null;
    fechaCreacion: string;
}

/* GET /api/usuarios/roles */
export interface RolCatalogo {
    id: number;
    nombre: string;
    descripcion: string | null;
}

/* Query string de GET /api/usuarios (todos opcionales). */
export interface UsuarioFiltros {
    filtroNombre?: string;
    rolId?: number;
    activo?: boolean;
}

/* POST /api/usuarios · PUT /api/usuarios/{id}.
   contrasena obligatoria al crear; vacío/nulo al editar conserva la actual. */
export interface UsuarioGuardarDto {
    nombreCompleto: string;
    email: string;
    telefono?: string;
    cuenta: string;
    rolId: number;
    contrasena?: string;
}

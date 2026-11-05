/* Sobre estándar de respuesta del backend LexControlApi (api.md §2). */
export interface RespuestaApi<T> {
    success: boolean;
    data: T;
    error: string | null;
}

/* Carga útil de POST /api/auth/login (api.md §4.1).
   Fechas en ISO 8601 UTC; Expiracion por defecto 15 minutos.
   debeCambiarContrasena: true cuando la contraseña actual es temporal
   (alta o restablecimiento); solo lo envía el login, no el refresh. */
export interface SesionRespuesta {
    token: string;
    expiracion: string;
    refreshToken: string;
    usuarioId: number;
    usuario: string;
    nombreCompleto: string;
    rolId: number;
    rol: string;
    debeCambiarContrasena?: boolean;
}

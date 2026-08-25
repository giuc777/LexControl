import { HttpErrorResponse } from '@angular/common/http';

/* Extrae el mensaje legible del sobre de error del backend (api.md §2).
   Los errores llegan como { success: false, error: "mensaje" } con el
   código HTTP correspondiente (400/401/404/409/500). */
export function mensajeDeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
        const cuerpo = error.error as { error?: string | null } | null;
        if (cuerpo && typeof cuerpo.error === 'string' && cuerpo.error.trim() !== '') {
            return cuerpo.error;
        }
    }
    return fallback;
}

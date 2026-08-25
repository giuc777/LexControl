import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth-service';
import { PermisosService, type ModuloKey } from '../permisos/permisos';

/* Fábrica de guard por módulo: carga el menú del rol (GET /api/permisos/
   {rolId}, cacheado) y valida que el módulo sea visible; si no, redirige al
   dashboard — mismo comportamiento del prototipo en layout.js. */
export function moduloGuard(modulo: ModuloKey): CanActivateFn {
    return async () => {
        const auth = inject(AuthService);
        const permisos = inject(PermisosService);
        const router = inject(Router);

        if (!auth.estaAutenticado()) {
            return router.createUrlTree(['/login']);
        }

        /* El fallback ante fallo del API vive dentro del servicio. */
        await firstValueFrom(permisos.cargarMenu()).catch(() => undefined);

        return permisos.tiene(modulo) ? true : router.createUrlTree(['/dashboard']);
    };
}

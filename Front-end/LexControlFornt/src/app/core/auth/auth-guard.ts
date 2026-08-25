import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth-service';

/* Protege las rutas autenticadas: sin sesión → /login. */
export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.estaAutenticado() ? true : router.createUrlTree(['/login']);
};

/* Evita volver a /login con sesión activa. */
export const loginGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.estaAutenticado() ? router.createUrlTree(['/dashboard']) : true;
};

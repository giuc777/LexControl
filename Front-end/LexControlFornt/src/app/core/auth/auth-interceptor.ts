import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth-service';

const RUTA_LOGIN = '/api/auth/login';

/* Interceptor global (agents.md §8):
   - Agrega Authorization: Bearer <token> a toda petición hacia el API.
   - Ante un 401 de un endpoint protegido (no el login), limpia la sesión
     y redirige a /login (token ausente o expirado). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    let peticion = req;
    const token = auth.token();

    if (token && req.url.startsWith(environment.apiBaseUrl)) {
        peticion = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }

    return next(peticion).pipe(
        catchError((error: unknown) => {
            if (
                error instanceof HttpErrorResponse &&
                error.status === 401 &&
                !peticion.url.includes(RUTA_LOGIN)
            ) {
                auth.cerrarSesion();
                router.navigateByUrl('/login');
            }
            return throwError(() => error);
        })
    );
};

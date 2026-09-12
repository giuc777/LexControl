import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth-service';

const RUTA_LOGIN = '/api/auth/login';
const RUTA_REFRESH = '/api/auth/refresh';

/* Interceptor global (agents.md §8):
   - Agrega Authorization: Bearer <token> a toda petición hacia el API.
   - Ante un 401 en un endpoint protegido (no login, no refresh),
     intenta refrescar el token una vez. Si falla, limpia sesión y redirige. */
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
                !peticion.url.includes(RUTA_LOGIN) &&
                !peticion.url.includes(RUTA_REFRESH)
            ) {
                return auth.refrescar().pipe(
                    switchMap(nuevaSesion => {
                        if (nuevaSesion) {
                            // Reintenta la petición original con el nuevo token
                            const retry = req.clone({ setHeaders: { Authorization: `Bearer ${nuevaSesion.token}` } });
                            return next(retry);
                        }
                        // Si el refresh falló, el AuthService ya limpió la sesión
                        router.navigateByUrl('/login');
                        return throwError(() => error);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};

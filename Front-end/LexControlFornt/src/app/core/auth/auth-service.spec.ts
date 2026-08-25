import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { RespuestaApi, SesionRespuesta } from '../api/respuesta-api';
import { AuthService } from './auth-service';

const URL_LOGIN = `${environment.apiBaseUrl}/api/auth/login`;

function respuestaSesion(): RespuestaApi<SesionRespuesta> {
    return {
        success: true,
        data: {
            token: 'jwt-de-prueba',
            expiracion: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            usuarioId: 1,
            usuario: 'admin',
            nombreCompleto: 'Administrador del Sistema',
            rolId: 1,
            rol: 'Administrador'
        },
        error: null
    };
}

describe('AuthService', () => {
    let servicio: AuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        sessionStorage.clear();

        /* resetTestingModule entre tests recrea el singleton, por lo que cada
           test lee el sessionStorage tal como lo deja su propio arreglo. */
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });

        httpMock = TestBed.inject(HttpTestingController);
        servicio = TestBed.inject(AuthService);
    });

    afterEach(() => {
        httpMock.verify();
        sessionStorage.clear();
    });

    it('inicia sesión y persiste el token en sessionStorage', () => {
        servicio.iniciarSesion('admin', 'admin123').subscribe(datos => {
            expect(datos.token).toBe('jwt-de-prueba');
            expect(datos.rol).toBe('Administrador');
        });

        const peticion = httpMock.expectOne(URL_LOGIN);
        expect(peticion.request.method).toBe('POST');
        expect(peticion.request.body).toEqual({ usuario: 'admin', contrasena: 'admin123' });
        peticion.flush(respuestaSesion());

        expect(servicio.estaAutenticado()).toBeTrue();
        expect(servicio.token()).toBe('jwt-de-prueba');
        expect(servicio.nombre()).toBe('Administrador del Sistema');
        expect(servicio.rol()).toBe('Administrador');
        expect(sessionStorage.getItem('lexcontrol_token')).toBe('jwt-de-prueba');
    });

    it('propaga el error con credenciales inválidas (401) y no crea sesión', () => {
        let codigoError = 0;

        servicio.iniciarSesion('admin', 'malaclave').subscribe({
            error: (error: { status?: number }) => {
                codigoError = error.status ?? 0;
            }
        });

        const peticion = httpMock.expectOne(URL_LOGIN);
        peticion.flush(
            { success: false, data: null, error: 'Credenciales incorrectas' },
            { status: 401, statusText: 'Unauthorized' }
        );

        expect(codigoError).toBe(401);
        expect(servicio.estaAutenticado()).toBeFalse();
        expect(sessionStorage.getItem('lexcontrol_token')).toBeNull();
    });

    it('rechaza una sesión almacenada con token vencido al reconstruirse', () => {
        /* Se simula un storage dejado por una sesión anterior ya vencida y se
           fuerza una instancia nueva (como al recargar la página). */
        sessionStorage.setItem('lexcontrol_token', 'jwt-vencido');
        sessionStorage.setItem('lexcontrol_usuario', 'admin');
        sessionStorage.setItem('lexcontrol_expiracion', new Date(Date.now() - 1000).toISOString());

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });

        const servicioFrio = TestBed.inject(AuthService);

        expect(servicioFrio.estaAutenticado()).toBeFalse();
        expect(sessionStorage.getItem('lexcontrol_token')).toBeNull();
    });

    it('cerrarSesion limpia el storage y la señal de sesión', () => {
        servicio.iniciarSesion('admin', 'admin123').subscribe();

        httpMock.expectOne(URL_LOGIN).flush(respuestaSesion());

        servicio.cerrarSesion();

        expect(servicio.estaAutenticado()).toBeFalse();
        expect(sessionStorage.getItem('lexcontrol_token')).toBeNull();
        expect(sessionStorage.getItem('lexcontrol_rol')).toBeNull();
    });
});

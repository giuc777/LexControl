import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PermisosService, matrizDefectoDe } from '../permisos/permisos';

const BASE = `${environment.apiBaseUrl}/api/permisos`;

function sembrarSesion(rolId: number, rol: string): void {
    sessionStorage.setItem('lexcontrol_token', 'jwt-prueba');
    sessionStorage.setItem('lexcontrol_usuario', 'admin');
    sessionStorage.setItem('lexcontrol_nombre', 'Administrador del Sistema');
    sessionStorage.setItem('lexcontrol_rolId', String(rolId));
    sessionStorage.setItem('lexcontrol_rol', rol);
    sessionStorage.setItem(
        'lexcontrol_expiracion',
        new Date(Date.now() + 60 * 60 * 1000).toISOString()
    );
}

describe('PermisosService', () => {
    let httpMock: HttpTestingController;

    beforeEach(() => {
        sessionStorage.clear();

        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });

        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        sessionStorage.clear();
    });

    it('carga y ordena el menú del rol autenticado (GET /api/permisos/{rolId})', () => {
        /* La sesión se siembra ANTES de crear el servicio: el constructor de
           AuthService lee el storage para conocer el rolId. */
        sembrarSesion(3, 'Abogado');
        const servicio = TestBed.inject(PermisosService);

        servicio.cargarMenu().subscribe();

        const peticion = httpMock.expectOne(`${BASE}/3`);
        expect(peticion.request.method).toBe('GET');
        peticion.flush({
            success: true,
            data: [
                { clave: 'clientes', nombre: 'Clientes', ruta: '/clientes', icono: 'people', orden: 2, activo: true },
                { clave: 'dashboard', nombre: 'Dashboard', ruta: '/dashboard', icono: 'dashboard', orden: 1, activo: true },
                { clave: 'reportes', nombre: 'Reportes', ruta: '/reportes', icono: 'chart', orden: 4, activo: false }
            ],
            error: null
        });

        const menu = servicio.menu();
        expect(menu.map(m => m.clave)).toEqual(['dashboard', 'clientes']);
        expect(servicio.tiene('dashboard')).toBeTrue();
        expect(servicio.tiene('reportes')).toBeFalse();
    });

    it('ante fallo del API conserva los defaults del rol sin romper la navegación', () => {
        sembrarSesion(1, 'Administrador');
        const servicio = TestBed.inject(PermisosService);

        servicio.cargarMenu().subscribe();

        httpMock.expectOne(`${BASE}/1`).flush(
            { success: false, data: null, error: 'Error interno' },
            { status: 500, statusText: 'Server Error' }
        );

        /* Administrador por defecto ve todo el menú. */
        expect(servicio.menuCargado()).toBeFalse();
        expect(servicio.menu().length).toBe(10);
        expect(servicio.tiene('mantenimiento')).toBeTrue();
    });

    it('obtiene la matriz completa agrupada por rol', () => {
        const servicio = TestBed.inject(PermisosService);
        let filas: unknown;

        servicio.obtenerMatriz().subscribe(data => (filas = data));

        httpMock.expectOne(BASE).flush({
            success: true,
            data: [{ rolId: 3, rol: 'Abogado', modulos: [] }],
            error: null
        });

        expect(filas).toEqual([{ rolId: 3, rol: 'Abogado', modulos: [] }]);
    });

    it('guarda la matriz completa de un rol con PUT', async () => {
        const servicio = TestBed.inject(PermisosService);

        /* Se lanza sin await para poder registrar la expectativa primero. */
        const promesa = firstValueFrom(servicio.guardarRol(3, { dashboard: true, clientes: false }));

        const peticion = httpMock.expectOne(`${BASE}/3`);
        expect(peticion.request.method).toBe('PUT');
        expect(peticion.request.body).toEqual({ modulos: { dashboard: true, clientes: false } });
        peticion.flush(null, { status: 204, statusText: 'No Content' });

        await promesa;
    });

    it('matrizDefectoDe devuelve copia editable de los defaults del rol', () => {
        const matriz = matrizDefectoDe('Secretaria');

        expect(matriz['dashboard']).toBeTrue();
        expect(matriz['historico']).toBeFalse();
        expect(matriz['notificaciones']).toBeFalse();

        matriz['dashboard'] = false;
        expect(matrizDefectoDe('Secretaria')['dashboard']).toBeTrue();
    });
});

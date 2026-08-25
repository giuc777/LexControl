import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { UsuariosService } from './usuarios-service';

const BASE = `${environment.apiBaseUrl}/api/usuarios`;

describe('UsuariosService', () => {
    let servicio: UsuariosService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });

        servicio = TestBed.inject(UsuariosService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('lista usuarios sin filtros', () => {
        servicio.listar().subscribe();

        const peticion = httpMock.expectOne(BASE);
        expect(peticion.request.method).toBe('GET');
        expect(peticion.request.params.keys().length).toBe(0);
        peticion.flush({ success: true, data: [], error: null });
    });

    it('envía los filtros como query params', () => {
        servicio.listar({ filtroNombre: 'carlos', rolId: 3, activo: false }).subscribe();

        const peticion = httpMock.expectOne(r =>
            r.url === BASE &&
            r.params.get('filtroNombre') === 'carlos' &&
            r.params.get('rolId') === '3' &&
            r.params.get('activo') === 'false'
        );
        expect(peticion.request.method).toBe('GET');
        peticion.flush({ success: true, data: [], error: null });
    });

    it('obtiene el catálogo de roles y desenvuelve el sobre', () => {
        let resultado: { id: number; nombre: string }[] | undefined;

        servicio.roles().subscribe(roles => (resultado = roles));

        httpMock.expectOne(`${BASE}/roles`).flush({
            success: true,
            data: [{ id: 1, nombre: 'Administrador', descripcion: null }],
            error: null
        });

        expect(resultado?.length).toBe(1);
        expect(resultado?.[0].nombre).toBe('Administrador');
    });

    it('crea un usuario con el body esperado', () => {
        const dto = {
            nombreCompleto: 'Lic. Ana López',
            email: 'ana@lexcontrol.gt',
            cuenta: 'alopez',
            rolId: 3,
            contrasena: 'ClaveSegura#1'
        };

        servicio.crear(dto).subscribe();

        const peticion = httpMock.expectOne(BASE);
        expect(peticion.request.method).toBe('POST');
        expect(peticion.request.body).toEqual(dto);
        peticion.flush({ success: true, data: { id: 9 }, error: null });
    });

    it('cambia el estado con PUT /{id}/estado', () => {
        servicio.cambiarEstado(7, false).subscribe();

        const peticion = httpMock.expectOne(`${BASE}/7/estado`);
        expect(peticion.request.method).toBe('PUT');
        expect(peticion.request.body).toEqual({ activo: false });
        peticion.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('desbloquea con POST /{id}/desbloquear', () => {
        servicio.desbloquear(7).subscribe();

        const peticion = httpMock.expectOne(`${BASE}/7/desbloquear`);
        expect(peticion.request.method).toBe('POST');
        peticion.flush(null, { status: 204, statusText: 'No Content' });
    });
});

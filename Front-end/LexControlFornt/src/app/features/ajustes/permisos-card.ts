import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { mensajeDeError } from '../../core/api/api-error';
import { ModuloPermiso, RolConModulos } from '../../core/models/permiso.model';
import { PermisosService, matrizDefectoDe } from '../../core/permisos/permisos';
import { ToastService } from '../../layout/toast/toast-service';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { ICONO_LLAVES } from './ajustes-iconos';

/* Tarjeta «Permisos de Roles» conectada a /api/permisos (api.md §4.4).
   Guardar envía la matriz completa de cada rol vía PUT (toda clave omitida
   queda oculta); Restaurar vuelve a enviar los valores por defecto.
   Reglas fijas: dashboard nunca oculto · al Administrador nunca se le quita
   ajustes (el backend también lo valida). */
@Component({
    selector: 'app-permisos-card',
    imports: [IconoSvg],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './permisos-card.html'
})
export class PermisosCard {
    private readonly permisosService = inject(PermisosService);
    private readonly toast = inject(ToastService);

    protected readonly iconoLlaves = ICONO_LLAVES;

    protected readonly filas = signal<RolConModulos[]>([]);
    protected readonly cargando = signal(true);
    protected readonly guardando = signal(false);
    protected readonly mensajeError = signal('');

    /* Columnas = unión de módulos devueltos por el API, ordenados. */
    protected readonly columnas = computed<ModuloPermiso[]>(() => {
        const porClave = new Map<string, ModuloPermiso>();

        for (const fila of this.filas()) {
            for (const modulo of fila.modulos) {
                const existente = porClave.get(modulo.clave);
                if (!existente || modulo.orden < existente.orden) {
                    porClave.set(modulo.clave, modulo);
                }
            }
        }

        return [...porClave.values()].sort((a, b) => a.orden - b.orden);
    });

    constructor() {
        this.cargar();
    }

    alternar(fila: RolConModulos, clave: string): void {
        this.filas.update(lista =>
            lista.map(f => {
                if (f.rolId !== fila.rolId) return f;

                return {
                    ...f,
                    modulos: f.modulos.map(m =>
                        m.clave === clave ? { ...m, activo: !m.activo } : m
                    )
                };
            })
        );
        this.mensajeError.set('');
    }

    obligatorio(rol: string, clave: string): boolean {
        return clave === 'dashboard' || (rol === 'Administrador' && clave === 'ajustes');
    }

    moduloDe(fila: RolConModulos, clave: string): ModuloPermiso | undefined {
        return fila.modulos.find(m => m.clave === clave);
    }

    async guardar(): Promise<void> {
        if (this.guardando()) return;

        this.guardando.set(true);
        this.mensajeError.set('');

        try {
            for (const fila of this.filas()) {
                const modulos: Record<string, boolean> = {};
                for (const m of fila.modulos) modulos[m.clave] = m.activo;

                await firstValueFrom(this.permisosService.guardarRol(fila.rolId, modulos));
            }

            /* Si el admin editó su propio rol, el sidebar se refresca al vuelo. */
            this.permisosService.recargarMenu();
            this.toast.mostrar('Permisos guardados correctamente.');
            await this.recargarMatriz();
        } catch (error: unknown) {
            this.reportarError(error);
        } finally {
            this.guardando.set(false);
        }
    }

    async restaurar(): Promise<void> {
        if (this.guardando()) return;

        this.guardando.set(true);
        this.mensajeError.set('');

        try {
            for (const fila of this.filas()) {
                await firstValueFrom(
                    this.permisosService.guardarRol(fila.rolId, matrizDefectoDe(fila.rol))
                );
            }

            this.permisosService.recargarMenu();
            this.toast.mostrar('Permisos restaurados a los valores por defecto.');
            await this.recargarMatriz();
        } catch (error: unknown) {
            this.reportarError(error);
        } finally {
            this.guardando.set(false);
        }
    }

    private async recargarMatriz(): Promise<void> {
        const matriz = await firstValueFrom(this.permisosService.obtenerMatriz());
        this.filas.set(matriz);
    }

    private cargar(): void {
        this.permisosService.obtenerMatriz()
            .subscribe({
                next: matriz => {
                    this.filas.set(matriz);
                    this.cargando.set(false);
                },
                error: (error: unknown) => {
                    this.cargando.set(false);
                    this.reportarError(error);
                }
            });
    }

    private reportarError(error: unknown): void {
        if (error instanceof HttpErrorResponse && error.status === 401) return;
        this.mensajeError.set(mensajeDeError(error, 'No fue posible completar la operación de permisos.'));
    }
}

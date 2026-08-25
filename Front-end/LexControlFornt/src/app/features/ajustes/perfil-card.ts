import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { mensajeDeError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth-service';
import { PerfilService } from '../../core/services/perfil-service';
import { ToastService } from '../../layout/toast/toast-service';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { Modal } from '../../shared/components/modal/modal';
import { ICONO_ESCUDO, ICONO_USUARIO } from './ajustes-iconos';

const MENSAJE_ERROR_CARGA = 'No fue posible cargar el perfil. Intenta de nuevo más tarde.';
const MENSAJE_ERROR_GUARDADO = 'No fue posible actualizar la información personal.';

/* Tarjeta «Perfil del Usuario» (Pototipo/js/ajustes.js renderPerfil +
   modal de ajustes-comun.js) conectada a GET/PUT /api/perfil. */
@Component({
    selector: 'app-perfil-card',
    imports: [ReactiveFormsModule, IconoSvg, Modal],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './perfil-card.html'
})
export class PerfilCard {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly perfilService = inject(PerfilService);
    private readonly auth = inject(AuthService);
    private readonly toast = inject(ToastService);

    protected readonly iconoUsuario = ICONO_USUARIO;
    protected readonly iconoEscudo = ICONO_ESCUDO;

    protected readonly perfil = signal<{
        nombre: string;
        rol: string;
        email: string;
        telefono: string;
    } | null>(null);

    protected readonly cargando = signal(true);
    protected readonly errorCarga = signal('');
    protected readonly modalAbierto = signal(false);
    protected readonly guardando = signal(false);
    protected readonly errorModal = signal('');

    protected readonly formulario = this.fb.group({
        nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
        telefono: ['', [Validators.maxLength(20)]]
    });

    constructor() {
        this.cargar();
    }

    abrirModal(): void {
        const p = this.perfil();
        if (!p) return;

        this.formulario.setValue({
            nombreCompleto: p.nombre,
            email: p.email,
            telefono: p.telefono
        });
        this.errorModal.set('');
        this.modalAbierto.set(true);
    }

    cerrarModal(): void {
        this.modalAbierto.set(false);
    }

    guardar(): void {
        if (this.guardando()) return;

        if (this.formulario.invalid) {
            this.errorModal.set('Revise los campos marcados antes de continuar.');
            return;
        }

        this.guardando.set(true);
        this.errorModal.set('');

        this.perfilService
            .actualizar(this.formulario.getRawValue())
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => {
                    const datos = this.formulario.getRawValue();
                    /* El topbar y la señal de sesión reflejan el nuevo nombre al instante. */
                    this.auth.actualizarNombre(datos.nombreCompleto);
                    this.perfil.set({
                        nombre: datos.nombreCompleto,
                        rol: this.perfil()?.rol ?? this.auth.rol(),
                        email: datos.email,
                        telefono: datos.telefono
                    });
                    this.modalAbierto.set(false);
                    this.toast.mostrar('Información personal actualizada.');
                },
                error: (error: unknown) => {
                    if (error instanceof HttpErrorResponse && error.status === 401) return;
                    this.errorModal.set(mensajeDeError(error, MENSAJE_ERROR_GUARDADO));
                }
            });
    }

    private cargar(): void {
        this.perfilService
            .obtener()
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: perfil => this.perfil.set({
                    nombre: perfil.nombreCompleto,
                    rol: perfil.rol,
                    email: perfil.email,
                    telefono: perfil.telefono
                }),
                error: (error: unknown) => {
                    if (error instanceof HttpErrorResponse && error.status === 401) return;
                    this.errorCarga.set(mensajeDeError(error, MENSAJE_ERROR_CARGA));
                }
            });
    }
}

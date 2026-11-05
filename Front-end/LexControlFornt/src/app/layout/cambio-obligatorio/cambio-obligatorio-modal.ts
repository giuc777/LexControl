import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { mensajeDeError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth-service';
import { confirmacionCoincide, politicaContrasena } from '../../core/forms/validadores-contrasena';
import { PerfilService } from '../../core/services/perfil-service';
import { ToastService } from '../toast/toast-service';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { Modal } from '../../shared/components/modal/modal';
import { ICONO_OJO, ICONO_OJO_OFF } from '../../features/ajustes/ajustes-iconos';

/* Modal bloqueante de cambio obligatorio de contraseña: se abre solo en el
   shell cuando el login responde debeCambiarContrasena = true (contraseña
   temporal de alta o restablecimiento). No se cierra con X, backdrop ni
   Escape (puedeCerrar=false y se omite (cerrado)); la única salida válida es
   cambiar la contraseña (PUT /api/perfil/contrasena) o cerrar sesión. */
@Component({
    selector: 'app-cambio-obligatorio-modal',
    imports: [ReactiveFormsModule, Modal, IconoSvg],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cambio-obligatorio-modal.html'
})
export class CambioObligatorioModal {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly perfilService = inject(PerfilService);
    private readonly toast = inject(ToastService);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly abierto = this.auth.debeCambiarContrasena;

    protected readonly iconoOjo = ICONO_OJO;
    protected readonly iconoOjoOff = ICONO_OJO_OFF;

    protected readonly visibles = signal<Record<string, boolean>>({});
    protected readonly guardando = signal(false);
    protected readonly mensajeError = signal('');

    /* IDs propios (prefijo obligatorio*) para no duplicar los IDs de la
       tarjeta Seguridad cuando ambas vistas están en el DOM. */
    protected readonly campos = [
        { id: 'obligatorioActual', control: 'contrasenaActual', etiqueta: 'Contraseña Actual', placeholder: '••••••••••••', autocomplete: 'current-password' },
        { id: 'obligatorioNueva', control: 'contrasenaNueva', etiqueta: 'Nueva Contraseña', placeholder: 'Min. 8 caracteres', autocomplete: 'new-password' },
        { id: 'obligatorioConfirmacion', control: 'confirmacion', etiqueta: 'Confirmar Nueva Contraseña', placeholder: 'Reingresar contraseña', autocomplete: 'new-password' }
    ];

    protected readonly formulario = this.fb.group(
        {
            contrasenaActual: ['', Validators.required],
            contrasenaNueva: ['', [Validators.required, politicaContrasena]],
            confirmacion: ['', Validators.required]
        },
        { validators: confirmacionCoincide }
    );

    alternarVisible(campo: string): void {
        this.visibles.update(v => ({ ...v, [campo]: !v[campo] }));
    }

    estaVisible(campo: string): boolean {
        return !!this.visibles()[campo];
    }

    guardar(): void {
        if (this.guardando()) return;

        if (this.formulario.invalid) {
            this.mensajeError.set('Complete los tres campos con una contraseña válida para continuar.');
            return;
        }

        this.mensajeError.set('');
        this.guardando.set(true);

        this.perfilService
            .cambiarContrasena(this.formulario.getRawValue())
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => {
                    this.formulario.reset();
                    this.auth.limpiarDebeCambiar();
                    this.toast.mostrar('Contraseña actualizada correctamente.');
                },
                error: (error: unknown) => {
                    if (error instanceof HttpErrorResponse && error.status === 401) return;
                    this.mensajeError.set(mensajeDeError(error, 'No fue posible actualizar la contraseña.'));
                }
            });
    }

    cerrarSesion(): void {
        this.auth.cerrarSesion();
        this.router.navigateByUrl('/login');
    }
}

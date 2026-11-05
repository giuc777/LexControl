import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { mensajeDeError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth-service';
import { confirmacionCoincide, politicaContrasena } from '../../core/forms/validadores-contrasena';
import { PerfilService } from '../../core/services/perfil-service';
import { ToastService } from '../../layout/toast/toast-service';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { ICONO_ESCUDO, ICONO_INFO, ICONO_OJO, ICONO_OJO_OFF } from './ajustes-iconos';

/* Tarjeta «Seguridad» conectada a PUT /api/perfil/contrasena (api.md §4.2).
   Réplica de renderSeguridad/cambiarContrasena del prototipo. */
@Component({
    selector: 'app-seguridad-card',
    imports: [ReactiveFormsModule, IconoSvg],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './seguridad-card.html'
})
export class SeguridadCard {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly perfilService = inject(PerfilService);
    private readonly toast = inject(ToastService);
    private readonly auth = inject(AuthService);

    protected readonly iconoEscudo = ICONO_ESCUDO;
    protected readonly iconoInfo = ICONO_INFO;
    protected readonly iconoOjo = ICONO_OJO;
    protected readonly iconoOjoOff = ICONO_OJO_OFF;

    protected readonly visibles = signal<Record<string, boolean>>({});
    protected readonly guardando = signal(false);
    protected readonly mensajeError = signal('');

    protected readonly campos = [
        { id: 'contrasenaActual', etiqueta: 'Contraseña Actual', placeholder: '••••••••••••', autocomplete: 'current-password' },
        { id: 'contrasenaNueva', etiqueta: 'Nueva Contraseña', placeholder: 'Min. 8 caracteres', autocomplete: 'new-password' },
        { id: 'confirmacion', etiqueta: 'Confirmar Nueva Contraseña', placeholder: 'Reingresar contraseña', autocomplete: 'new-password' }
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
}

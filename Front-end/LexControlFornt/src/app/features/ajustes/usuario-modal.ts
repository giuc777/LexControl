import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { mensajeDeError } from '../../core/api/api-error';
import { RolCatalogo, UsuarioGuardarDto, UsuarioLista } from '../../core/models/usuario.model';
import { UsuariosService } from '../../core/services/usuarios-service';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { Modal } from '../../shared/components/modal/modal';
import { ICONO_INFO } from './ajustes-iconos';

const MENSAJE_ERROR = 'No fue posible guardar el usuario.';
const PATRON_CUENTA = /^[A-Za-z0-9._-]+$/;

function cuentaValida(control: { value: string }): ValidationErrors | null {
    if (!PATRON_CUENTA.test(control.value)) {
        return { cuenta: 'Use letras, números, punto, guion o guion bajo.' };
    }
    return null;
}

/* Política del backend: mínimo 8 caracteres, un dígito y un especial.
   Vacío no es error aquí: al editar la contraseña es opcional. */
function politicaContrasena(control: { value: string }): ValidationErrors | null {
    const valor = String(control.value ?? '');
    if (valor === '') return null;
    if (valor.length < 8) return { politica: 'Mínimo 8 caracteres.' };
    if (!/\d/.test(valor)) return { politica: 'Debe incluir al menos un número.' };
    if (!/[^A-Za-z0-9]/.test(valor)) return { politica: 'Debe incluir al menos un carácter especial.' };
    return null;
}

/* Modal crear/editar usuario (api.md §4.3). Al editar, la contraseña es
   opcional: vacía conserva la actual (comportamiento documentado del PUT). */
@Component({
    selector: 'app-usuario-modal',
    imports: [ReactiveFormsModule, IconoSvg, Modal],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './usuario-modal.html'
})
export class UsuarioModal {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly usuariosService = inject(UsuariosService);

    readonly abierto = input.required<boolean>();
    readonly roles = input.required<RolCatalogo[]>();
    readonly usuario = input<UsuarioLista | null>(null);
    readonly cerrado = output<void>();
    readonly guardado = output<void>();

    protected readonly iconoInfo = ICONO_INFO;
    protected readonly guardando = signal(false);
    protected readonly mensajeError = signal('');

    protected readonly formulario = this.fb.group({
        nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
        cuenta: ['', [Validators.required, cuentaValida, Validators.maxLength(50)]],
        rolId: ['', Validators.required],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
        telefono: ['', [Validators.maxLength(20)]],
        contrasena: ['']
    });

    constructor() {
        /* Cada vez que se abre el modal se rellena según alta/edición y la
           contraseña pasa a obligatoria solo en el alta. */
        effect(() => {
            if (!this.abierto()) return;

            const u = this.usuario();
            this.formulario.setValue({
                nombreCompleto: u?.nombreCompleto ?? '',
                cuenta: u?.usuario ?? '',
                rolId: u ? String(u.rolId) : '',
                email: u?.email ?? '',
                telefono: u?.telefono ?? '',
                contrasena: ''
            });
            this.mensajeError.set('');
            this.aplicarReglasContrasena(!u);
        });
    }

    get titulo(): string {
        return this.usuario() ? 'Editar usuario' : 'Nuevo usuario';
    }

    cerrar(): void {
        this.cerrado.emit();
    }

    guardar(): void {
        if (this.guardando()) return;

        if (this.formulario.invalid) {
            this.mensajeError.set(this.primerError());
            return;
        }

        const valores = this.formulario.getRawValue();
        const dto: UsuarioGuardarDto = {
            nombreCompleto: valores.nombreCompleto.trim(),
            email: valores.email.trim(),
            telefono: valores.telefono.trim() || undefined,
            cuenta: valores.cuenta.trim(),
            rolId: Number(valores.rolId)
        };
        if (valores.contrasena) dto.contrasena = valores.contrasena;

        const existente = this.usuario();
        const peticion$ = existente
            ? this.usuariosService.actualizar(existente.id, dto)
            : this.usuariosService.crear(dto);

        this.guardando.set(true);
        peticion$
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => {
                    this.cerrado.emit();
                    this.guardado.emit();
                },
                error: (error: unknown) => {
                    if (error instanceof HttpErrorResponse && error.status === 401) return;
                    this.mensajeError.set(mensajeDeError(error, MENSAJE_ERROR));
                }
            });
    }

    private aplicarReglasContrasena(obligatoria: boolean): void {
        const control = this.formulario.controls.contrasena;
        control.setValidators(obligatoria
            ? [Validators.required, politicaContrasena]
            : politicaContrasena);
        control.updateValueAndValidity();
    }

    private primerError(): string {
        const c = this.formulario.controls;

        if (c.nombreCompleto.hasError('required')) return 'El nombre completo es obligatorio.';
        if (c.email.hasError('required')) return 'Ingrese un correo electrónico válido.';
        if (c.email.invalid) return 'Ingrese un correo electrónico válido.';
        if (c.cuenta.hasError('required')) return 'Ingrese un nombre de usuario válido (letras, números, punto, guion o guion bajo).';
        if (c.cuenta.invalid) return 'Ingrese un nombre de usuario válido (letras, números, punto, guion o guion bajo).';
        if (c.rolId.hasError('required')) return 'Seleccione un rol válido.';
        if (c.telefono.invalid) return 'El teléfono no puede exceder los 20 caracteres.';

        const errorContrasena = c.contrasena.errors?.['politica'] as string | undefined;
        if (errorContrasena) return errorContrasena;
        if (c.contrasena.hasError('required')) return 'Debe asignar una contraseña al usuario.';

        return 'Revise los campos marcados antes de continuar.';
    }
}

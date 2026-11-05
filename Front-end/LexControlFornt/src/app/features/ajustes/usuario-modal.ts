import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { mensajeDeError } from '../../core/api/api-error';
import { RolCatalogo, UsuarioGuardarDto, UsuarioLista } from '../../core/models/usuario.model';
import { UsuariosService } from '../../core/services/usuarios-service';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { Modal } from '../../shared/components/modal/modal';

const MENSAJE_ERROR = 'No fue posible guardar el usuario.';
const PATRON_CUENTA = /^[A-Za-z0-9._-]+$/;

function cuentaValida(control: { value: string }): ValidationErrors | null {
    if (!PATRON_CUENTA.test(control.value)) {
        return { cuenta: 'Use letras, números, punto, guion o guion bajo.' };
    }
    return null;
}

/* Contraseña temporal para el alta: se genera en el navegador con
   aleatoriedad criptográfica y cumple la política del backend
   (8+, un dígito y un especial). El administrador no la elige. */
const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz';
const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITOS = '23456789';
const ESPECIALES = '!@#$%&*?+-=';

function azar(limite: number): number {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % limite;
}

function generarContrasenaTemporal(): string {
    const todos = MINUSCULAS + MAYUSCULAS + DIGITOS + ESPECIALES;
    const caracteres = [
        MINUSCULAS[azar(MINUSCULAS.length)],
        MAYUSCULAS[azar(MAYUSCULAS.length)],
        DIGITOS[azar(DIGITOS.length)],
        ESPECIALES[azar(ESPECIALES.length)]
    ];
    while (caracteres.length < 12) caracteres.push(todos[azar(todos.length)]);

    for (let i = caracteres.length - 1; i > 0; i--) {
        const j = azar(i + 1);
        [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }
    return caracteres.join('');
}

/* Modal crear/editar usuario (api.md §4.3). No tiene campo de contraseña:
   en el alta se genera una temporal que se muestra una sola vez al guardar
   (salida contrasenaTemporal); al editar la contraseña no se toca. */
@Component({
    selector: 'app-usuario-modal',
    imports: [ReactiveFormsModule, Modal],
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
    readonly contrasenaTemporal = output<{ cuenta: string; contrasena: string }>();

    protected readonly guardando = signal(false);
    protected readonly mensajeError = signal('');

    protected readonly formulario = this.fb.group({
        nombreCompleto: ['', [Validators.required, Validators.maxLength(100)]],
        cuenta: ['', [Validators.required, cuentaValida, Validators.maxLength(50)]],
        rolId: ['', Validators.required],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
        telefono: ['', [Validators.maxLength(20)]]
    });

    constructor() {
        /* Cada vez que se abre el modal se rellena según alta/edición. */
        effect(() => {
            if (!this.abierto()) return;

            const u = this.usuario();
            this.formulario.setValue({
                nombreCompleto: u?.nombreCompleto ?? '',
                cuenta: u?.usuario ?? '',
                rolId: u ? String(u.rolId) : '',
                email: u?.email ?? '',
                telefono: u?.telefono ?? ''
            });
            this.mensajeError.set('');
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
        const cuenta = valores.cuenta.trim();
        const dto: UsuarioGuardarDto = {
            nombreCompleto: valores.nombreCompleto.trim(),
            email: valores.email.trim(),
            telefono: valores.telefono.trim() || undefined,
            cuenta,
            rolId: Number(valores.rolId)
        };

        const existente = this.usuario();
        let temporal: string | undefined;
        if (!existente) {
            temporal = generarContrasenaTemporal();
            dto.contrasena = temporal;
        }

        const peticion$ = existente
            ? this.usuariosService.actualizar(existente.id, dto)
            : this.usuariosService.crear(dto);

        this.guardando.set(true);
        peticion$
            .pipe(finalize(() => this.guardando.set(false)))
            .subscribe({
                next: () => {
                    this.cerrado.emit();
                    if (temporal) this.contrasenaTemporal.emit({ cuenta, contrasena: temporal });
                    this.guardado.emit();
                },
                error: (error: unknown) => {
                    if (error instanceof HttpErrorResponse && error.status === 401) return;
                    this.mensajeError.set(mensajeDeError(error, MENSAJE_ERROR));
                }
            });
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

        return 'Revise los campos marcados antes de continuar.';
    }
}

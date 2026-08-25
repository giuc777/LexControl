import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { mensajeDeError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth-service';

type EstadoLogin = 'idle' | 'verificando' | 'exito';

const MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos. Por favor, verifica tus credenciales e intenta de nuevo.';
const MENSAJE_GENERICO = 'No fue posible iniciar sesión. Por favor, intenta de nuevo más tarde.';

/* Réplica de Pototipo/index.html + login.js conectada al backend:
   POST /api/auth/login con { usuario, contrasena } (api.md §4.1,
   agents.md §6.1). El texto del error 401 es el mismo del prototipo. */
@Component({
    selector: 'app-login-page',
    imports: [ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'login-page' },
    templateUrl: './login-page.html'
})
export class LoginPage {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    readonly formulario = this.fb.group({
        usuario: ['', Validators.required],
        contrasena: ['', Validators.required]
    });

    readonly estado = signal<EstadoLogin>('idle');
    /* Marca los campos en rojo tras un envío; se limpia al escribir. */
    readonly intentado = signal(false);
    readonly mensajeError = signal('');

    get controlUsuario() {
        return this.formulario.controls.usuario;
    }

    get controlContrasena() {
        return this.formulario.controls.contrasena;
    }

    constructor() {
        this.formulario.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.intentado.set(false));
    }

    get etiquetaBoton(): string {
        switch (this.estado()) {
            case 'verificando': return 'Verificando…';
            case 'exito': return 'Ingresando…';
            default: return 'Iniciar Sesión';
        }
    }

    enviar(): void {
        if (this.estado() !== 'idle') return;

        this.intentado.set(true);
        this.mensajeError.set('');

        if (this.formulario.invalid) {
            this.mensajeError.set('Por favor, complete todos los campos.');
            return;
        }

        this.estado.set('verificando');

        this.auth
            .iniciarSesion(this.controlUsuario.value.trim(), this.controlContrasena.value)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.estado.set('exito');
                    /* Pausa breve para que el usuario lea el mensaje de bienvenida,
                       igual que en el prototipo. */
                    setTimeout(() => this.router.navigateByUrl('/dashboard'), 900);
                },
                error: (error: unknown) => {
                    this.estado.set('idle');

                    if (error instanceof HttpErrorResponse && error.status === 401) {
                        this.mensajeError.set(MENSAJE_CREDENCIALES);
                        return;
                    }

                    /* 400 (validación del DTO) u otros: mostrar el mensaje del backend. */
                    this.mensajeError.set(mensajeDeError(error, MENSAJE_GENERICO));
                }
            });
    }

    solicitarAcceso(evento: Event): void {
        evento.preventDefault();
    }
}

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, startWith } from 'rxjs';

import { mensajeDeError } from '../../core/api/api-error';
import { RolCatalogo, UsuarioFiltros, UsuarioLista } from '../../core/models/usuario.model';
import { UsuariosService } from '../../core/services/usuarios-service';
import { ToastService } from '../../layout/toast/toast-service';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { Modal } from '../../shared/components/modal/modal';
import { ICONO_PLUS, ICONO_USUARIOS, colorRol } from './ajustes-iconos';
import { ContrasenaTemporalModal } from './contrasena-temporal-modal';
import { UsuarioModal } from './usuario-modal';

/* Tarjeta «Usuarios del Sistema» conectada a /api/usuarios (api.md §4.3):
   listado con filtros, alta/edición vía modal y activar/desactivar/desbloquear.
   El alta genera una contraseña temporal y restablecer usa POST /{id}/restablecer;
   en ambos casos la clave se muestra una sola vez en contrasena-temporal-modal. */
@Component({
    selector: 'app-usuarios-card',
    imports: [ReactiveFormsModule, IconoSvg, Modal, UsuarioModal, ContrasenaTemporalModal],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './usuarios-card.html'
})
export class UsuariosCard {
    private readonly fb = inject(NonNullableFormBuilder);
    private readonly usuariosService = inject(UsuariosService);
    private readonly toast = inject(ToastService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly iconoUsuarios = ICONO_USUARIOS;
    protected readonly iconoPlus = ICONO_PLUS;

    protected readonly usuarios = signal<UsuarioLista[] | null>(null);
    protected readonly roles = signal<RolCatalogo[]>([]);
    protected readonly cargando = signal(true);
    protected readonly procesando = signal(false);

    protected readonly modalAbierto = signal(false);
    protected readonly editando = signal<UsuarioLista | null>(null);

    /* Confirmación previa al restablecimiento (rompe la contraseña actual). */
    protected readonly confirmando = signal<UsuarioLista | null>(null);

    /* Contraseña temporal generada (alta o restablecimiento), vista una sola vez. */
    protected readonly temporal = signal<{ cuenta: string; contrasena: string } | null>(null);

    /* Filtros conectados a los query params del API. */
    protected readonly filtros = this.fb.group({
        filtroNombre: [''],
        rolId: [''],
        activo: ['']
    });

    constructor() {
        this.cargarRoles();

        this.filtros.valueChanges
            .pipe(
                startWith(this.filtros.getRawValue()),
                debounceTime(300),
                distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => this.cargar());
    }

    abrirNuevo(): void {
        this.editando.set(null);
        this.modalAbierto.set(true);
    }

    abrirEdicion(usuario: UsuarioLista): void {
        this.editando.set(usuario);
        this.modalAbierto.set(true);
    }

    cerrarModal(): void {
        this.modalAbierto.set(false);
        this.editando.set(null);
    }

    alGuardar(): void {
        const eraEdicion = this.editando() !== null;
        this.cerrarModal();
        this.toast.mostrar(eraEdicion ? 'Usuario actualizado.' : 'Usuario creado correctamente.');
        this.cargar();
    }

    mostrarTemporal(datos: { cuenta: string; contrasena: string }): void {
        this.temporal.set(datos);
    }

    cerrarTemporal(): void {
        this.temporal.set(null);
    }

    solicitarRestablecer(usuario: UsuarioLista): void {
        this.confirmando.set(usuario);
    }

    cerrarConfirmacion(): void {
        this.confirmando.set(null);
    }

    restablecer(): void {
        const usuario = this.confirmando();
        if (!usuario || this.procesando()) return;

        this.procesando.set(true);
        this.usuariosService.restablecerContrasena(usuario.id)
            .pipe(finalize(() => this.procesando.set(false)))
            .subscribe({
                next: resultado => {
                    this.confirmando.set(null);
                    this.temporal.set({ cuenta: resultado.usuario, contrasena: resultado.contrasenaTemporal });
                    this.toast.mostrar(`Contraseña de «${usuario.usuario}» restablecida.`);
                    this.cargar();
                },
                error: (error: unknown) => {
                    this.confirmando.set(null);
                    this.errorOperacion(error);
                }
            });
    }

    alternarActivo(usuario: UsuarioLista): void {
        if (this.procesando()) return;

        const nuevoEstado = !usuario.activo;
        this.procesando.set(true);

        this.usuariosService.cambiarEstado(usuario.id, nuevoEstado)
            .pipe(finalize(() => this.procesando.set(false)))
            .subscribe({
                next: () => {
                    this.actualizarFila({ ...usuario, activo: nuevoEstado });
                    this.toast.mostrar(`Usuario «${usuario.usuario}» ${nuevoEstado ? 'activado' : 'desactivado'}.`);
                },
                error: (error: unknown) => this.errorOperacion(error)
            });
    }

    desbloquear(usuario: UsuarioLista): void {
        if (this.procesando()) return;

        this.procesando.set(true);

        this.usuariosService.desbloquear(usuario.id)
            .pipe(finalize(() => this.procesando.set(false)))
            .subscribe({
                next: () => {
                    this.actualizarFila({ ...usuario, bloqueado: false });
                    this.toast.mostrar(`Usuario «${usuario.usuario}» desbloqueado.`);
                },
                error: (error: unknown) => this.errorOperacion(error)
            });
    }

    colorDeRol(nombre: string): { bg: string; fg: string } {
        return colorRol(nombre);
    }

    private cargar(): void {
        const valores = this.filtros.getRawValue();
        const filtros: UsuarioFiltros = {};

        if (valores.filtroNombre.trim()) filtros.filtroNombre = valores.filtroNombre.trim();
        if (valores.rolId !== '') filtros.rolId = Number(valores.rolId);
        if (valores.activo !== '') filtros.activo = valores.activo === 'true';

        this.usuariosService.listar(filtros)
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: lista => this.usuarios.set(lista),
                error: (error: unknown) => {
                    this.usuarios.set([]);
                    if (error instanceof HttpErrorResponse && error.status === 401) return;
                    this.toast.mostrar(mensajeDeError(error, 'No fue posible cargar los usuarios.'));
                }
            });
    }

    private cargarRoles(): void {
        this.usuariosService.roles().subscribe({
            next: roles => this.roles.set(roles),
            error: () => this.roles.set([])
        });
    }

    private actualizarFila(actualizado: UsuarioLista): void {
        this.usuarios.update(lista =>
            (lista ?? []).map(u => (u.id === actualizado.id ? actualizado : u))
        );
    }

    private errorOperacion(error: unknown): void {
        /* 401 lo maneja el interceptor (logout + redirect). */
        if (error instanceof HttpErrorResponse && error.status === 401) return;
        this.toast.mostrar(mensajeDeError(error, 'La operación no pudo completarse.'));
    }
}

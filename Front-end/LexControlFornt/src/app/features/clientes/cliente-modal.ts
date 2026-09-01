import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Modal } from '../../shared/components/modal/modal';
import { ClienteActualizarDto, ClienteDetalle, ClienteGuardarDto } from '../../core/models/cliente.model';

/* Modal para crear o editar un cliente. Replica el formulario del prototipo
   (Pototipo/js/clientes-comun.js:245-462) con validación client-side. */
@Component({
    selector: 'app-cliente-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Modal],
    templateUrl: './cliente-modal.html'
})
export class ClienteModal implements OnChanges {
    @Input() abierto = false;
    @Input() modo: 'nuevo' | 'editar' = 'nuevo';
    @Input() cliente: ClienteDetalle | null = null;

    @Output() readonly cerrado = new EventEmitter<void>();
    @Output() readonly guardado = new EventEmitter<ClienteGuardarDto | ClienteActualizarDto>();

    protected readonly titulo = signal('Nuevo Cliente');
    protected readonly textoBoton = signal('Guardar cliente');
    protected readonly error = signal('');

    protected nombre = '';
    protected dpi = '';
    protected fechaNacimiento = '';
    protected genero = '';
    protected tipoCliente = 'Particular';
    protected telefonoPrincipal = '';
    protected emailPrincipal = '';
    protected telefonoSecundario = '';
    protected emailSecundario = '';
    protected direccion = '';
    protected notas = '';

    ngOnChanges(cambios: SimpleChanges): void {
        if (cambios['abierto'] && this.abierto) {
            this.error.set('');
            if (this.modo === 'editar' && this.cliente) {
                this.titulo.set('Editar Cliente');
                this.textoBoton.set('Guardar cambios');
                this.nombre = this.cliente.nombreCompleto;
                this.dpi = this.cliente.dpi ?? '';
                this.fechaNacimiento = this.cliente.fechaNacimiento ?? '';
                this.genero = this.cliente.genero ?? '';
                this.tipoCliente = this.cliente.tipoCliente ?? 'Particular';
                this.telefonoPrincipal = this.cliente.telefonoPrincipal ?? '';
                this.emailPrincipal = this.cliente.emailPrincipal ?? '';
                this.telefonoSecundario = this.cliente.telefonoSecundario ?? '';
                this.emailSecundario = this.cliente.emailSecundario ?? '';
                this.direccion = this.cliente.direccion ?? '';
                this.notas = this.cliente.notas ?? '';
            } else {
                this.titulo.set('Nuevo Cliente');
                this.textoBoton.set('Guardar cliente');
                this.limpiarFormulario();
            }
        }
    }

    alEnviar(evento: Event): void {
        evento.preventDefault();
        this.error.set('');

        if (!this.nombre.trim()) {
            this.error.set('El nombre completo es obligatorio.');
            return;
        }
        if (this.dpi.replace(/\D/g, '').length !== 13) {
            this.error.set('El DPI debe contener exactamente 13 dígitos.');
            return;
        }
        if (!this.telefonoPrincipal.trim()) {
            this.error.set('El teléfono principal es obligatorio.');
            return;
        }
        if (!this.emailPrincipal.trim()) {
            this.error.set('El email principal es obligatorio.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.emailPrincipal)) {
            this.error.set('El email principal no es válido.');
            return;
        }
        if (this.emailSecundario && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.emailSecundario)) {
            this.error.set('El email secundario no es válido.');
            return;
        }

        const base: ClienteGuardarDto = {
            nombreCompleto: this.nombre.trim(),
            dpi: this.dpi.replace(/\D/g, '') || null,
            telefonoPrincipal: this.telefonoPrincipal.trim() || null,
            emailPrincipal: this.emailPrincipal.trim() || null,
            direccion: this.direccion.trim() || null,
            telefonoSecundario: this.telefonoSecundario.trim() || null,
            emailSecundario: this.emailSecundario.trim() || null,
            tipoCliente: this.tipoCliente || null,
            notas: this.notas.trim() || null
        };

        if (this.modo === 'editar') {
            const datos: ClienteActualizarDto = {
                ...base,
                fechaNacimiento: this.fechaNacimiento || null,
                genero: this.genero || null
            };
            this.guardado.emit(datos);
        } else {
            this.guardado.emit(base);
        }
    }

    private limpiarFormulario(): void {
        this.nombre = '';
        this.dpi = '';
        this.fechaNacimiento = '';
        this.genero = '';
        this.tipoCliente = 'Particular';
        this.telefonoPrincipal = '';
        this.emailPrincipal = '';
        this.telefonoSecundario = '';
        this.emailSecundario = '';
        this.direccion = '';
        this.notas = '';
    }
}

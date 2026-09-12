import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Modal } from '../../shared/components/modal/modal';
import { ExpedienteCrearDto, ExpedienteActualizarDto, ExpedienteDetalle } from '../../core/models/expediente.model';
import { ClientesService } from '../../core/services/clientes-service';
import { UsuariosService } from '../../core/services/usuarios-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { ClienteLista } from '../../core/models/cliente.model';
import { UsuarioLista } from '../../core/models/usuario.model';
import { CatalogoItem } from '../../core/models/catalogo.model';

@Component({
    selector: 'app-expediente-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Modal],
    templateUrl: './expediente-modal.html'
})
export class ExpedienteModal implements OnChanges {
    @Input() abierto = false;
    @Input() modo: 'nuevo' | 'editar' = 'nuevo';
    @Input() expediente: ExpedienteDetalle | null = null;

    @Output() readonly cerrado = new EventEmitter<void>();
    @Output() readonly guardado = new EventEmitter<ExpedienteCrearDto | ExpedienteActualizarDto>();

    private readonly clientesService = inject(ClientesService);
    private readonly usuariosService = inject(UsuariosService);
    private readonly catalogosService = inject(CatalogosService);

    protected readonly titulo = signal('Nuevo Expediente');
    protected readonly textoBoton = signal('Guardar expediente');
    protected readonly error = signal('');
    protected readonly guardando = signal(false);

    protected ramas: CatalogoItem[] = [];
    protected estados: CatalogoItem[] = [];
    protected rolesProcesales: CatalogoItem[] = [];
    protected juzgados: { id: number; nombre: string }[] = [];

    protected clientes: ClienteLista[] = [];
    protected abogados: UsuarioLista[] = [];

    protected noExpediente = '';
    protected clienteId = 0;
    protected rolProcesalId = 0;
    protected ramaId = 0;
    protected tipoProceso = '';
    protected juzgadoId = 0;
    protected fechaIngreso = '';
    protected estadoId = 1;
    protected descripcion = '';
    protected notasInternas = '';
    protected abogadoId = 0;

    ngOnChanges(cambios: SimpleChanges): void {
        if (cambios['abierto'] && this.abierto) {
            this.error.set('');
            this.guardando.set(false);
            this.cargarCatalogos();
            this.cargarClientes();
            this.cargarAbogados();
            if (this.modo === 'editar' && this.expediente) {
                this.titulo.set('Editar Expediente');
                this.textoBoton.set('Guardar cambios');
                this.noExpediente = this.expediente.noExpediente;
                this.clienteId = this.expediente.clienteId;
                this.rolProcesalId = this.expediente.rolProcesalId;
                this.ramaId = this.expediente.ramaId;
                this.tipoProceso = this.expediente.tipoProceso ?? '';
                this.juzgadoId = this.expediente.juzgadoId;
                this.fechaIngreso = this.expediente.fechaIngreso ?? '';
                this.estadoId = this.expediente.estadoId;
                this.descripcion = this.expediente.descripcion ?? '';
                this.notasInternas = this.expediente.notasInternas ?? '';
                this.abogadoId = this.expediente.abogadoId;
            } else {
                this.titulo.set('Nuevo Expediente');
                this.textoBoton.set('Guardar expediente');
                this.limpiarFormulario();
            }
        }
    }

    alEnviar(evento: Event): void {
        evento.preventDefault();
        if (this.guardando()) return;
        this.error.set('');

        if (!this.noExpediente.trim()) {
            this.error.set('El numero de expediente es obligatorio.');
            return;
        }
        if (!this.clienteId) {
            this.error.set('El cliente es obligatorio.');
            return;
        }
        if (!this.rolProcesalId) {
            this.error.set('El rol procesal es obligatorio.');
            return;
        }
        if (!this.ramaId) {
            this.error.set('La rama es obligatoria.');
            return;
        }
        if (!this.juzgadoId) {
            this.error.set('El juzgado es obligatorio.');
            return;
        }
        if (!this.abogadoId) {
            this.error.set('El abogado asignado es obligatorio.');
            return;
        }

        this.guardando.set(true);

        if (this.modo === 'editar') {
            const datos: ExpedienteActualizarDto = {
                clienteId: this.clienteId || null,
                rolProcesalId: this.rolProcesalId || null,
                ramaId: this.ramaId || null,
                tipoProceso: this.tipoProceso.trim() || null,
                juzgadoId: this.juzgadoId || null,
                estadoId: this.estadoId || null,
                descripcion: this.descripcion.trim() || null,
                notasInternas: this.notasInternas.trim() || null,
                fechaCierre: null
            };
            this.guardado.emit(datos);
        } else {
            const datos: ExpedienteCrearDto = {
                noExpediente: this.noExpediente.trim(),
                clienteId: this.clienteId,
                rolProcesalId: this.rolProcesalId,
                ramaId: this.ramaId,
                tipoProceso: this.tipoProceso.trim() || null,
                juzgadoId: this.juzgadoId,
                fechaIngreso: this.fechaIngreso || null,
                estadoId: this.estadoId,
                descripcion: this.descripcion.trim() || null,
                notasInternas: this.notasInternas.trim() || null,
                abogadoId: this.abogadoId
            };
            this.guardado.emit(datos);
        }
    }

    private cargarClientes(): void {
        this.clientesService.listar({ pagina: 1, tamanioPagina: 500 }).subscribe({
            next: resp => this.clientes = resp.clientes,
            error: () => this.clientes = []
        });
    }

    private cargarAbogados(): void {
        this.usuariosService.listar({ rolId: 3, activo: true }).subscribe({
            next: users => this.abogados = users,
            error: () => this.abogados = []
        });
    }

    private cargarCatalogos(): void {
        this.catalogosService.buscarCatalogo('RAMA', { tamanoPagina: 500 }).subscribe({
            next: resp => this.ramas = resp.items,
            error: () => this.ramas = []
        });
        this.catalogosService.buscarCatalogo('ESTADO_EXPEDIENTE', { tamanoPagina: 500 }).subscribe({
            next: resp => this.estados = resp.items,
            error: () => this.estados = []
        });
        this.catalogosService.buscarCatalogo('ROL_PROCESAL', { tamanoPagina: 500 }).subscribe({
            next: resp => this.rolesProcesales = resp.items,
            error: () => this.rolesProcesales = []
        });
        this.catalogosService.buscarJuzgados({ tamanoPagina: 500 }).subscribe({
            next: resp => this.juzgados = resp.items.map(j => ({ id: j.id, nombre: j.nombre })),
            error: () => this.juzgados = []
        });
    }

    private limpiarFormulario(): void {
        this.noExpediente = '';
        this.clienteId = 0;
        this.rolProcesalId = 0;
        this.ramaId = 0;
        this.tipoProceso = '';
        this.juzgadoId = 0;
        this.fechaIngreso = '';
        this.estadoId = 1;
        this.descripcion = '';
        this.notasInternas = '';
        this.abogadoId = 0;
    }
}

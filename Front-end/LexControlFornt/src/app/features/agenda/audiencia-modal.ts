import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Modal } from '../../shared/components/modal/modal';
import { AudienciasService } from '../../core/services/audiencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-audiencia-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Modal],
    templateUrl: './audiencia-modal.html'
})
export class AudienciaModal implements OnInit {
    @Output() cerrar = new EventEmitter<void>();
    @Output() creado = new EventEmitter<void>();

    private readonly audienciasSvc = inject(AudienciasService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly toast = inject(ToastService);

    protected readonly guardando = signal(false);
    protected readonly error = signal('');
    protected readonly expedientes = signal<{ id: number; noExpediente: string; cliente: string }[]>([]);
    protected readonly tipos = signal<{ id: number; nombre: string }[]>([]);
    protected readonly estados = signal<{ id: number; nombre: string }[]>([]);
    protected readonly juzgados = signal<{ id: number; nombre: string }[]>([]);

    protected expedienteId = 0;
    protected tipoId = 0;
    protected estadoId = 0;
    protected fecha = '';
    protected horaInicio = '';
    protected horaFin = '';
    protected juzgadoId = 0;
    protected sala = '';
    protected notas = '';

    ngOnInit(): void {
        this.expedientesSvc.listar({ tamanioPagina: 100 }).subscribe({
            next: (datos) => this.expedientes.set(datos.expedientes.map(e => ({
                id: e.id,
                noExpediente: e.noExpediente,
                cliente: e.cliente
            })))
        });

        this.catalogosSvc.buscarCatalogo('TIPO_AUDIENCIA').subscribe({
            next: (datos) => this.tipos.set(datos.items.map(i => ({ id: i.id, nombre: i.nombre })))
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_AUDIENCIA').subscribe({
            next: (datos) => this.estados.set(datos.items.map(i => ({ id: i.id, nombre: i.nombre })))
        });
        this.catalogosSvc.buscarJuzgados().subscribe({
            next: (datos) => this.juzgados.set(datos.items.map(j => ({ id: j.id, nombre: j.nombre }))),
            error: () => this.juzgados.set([])
        });

        const hoy = new Date();
        this.fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    }

    alCerrar(): void {
        this.cerrar.emit();
    }

    alEnviar(evento: Event): void {
        evento.preventDefault();
        this.error.set('');

        if (!this.expedienteId) {
            this.error.set('Seleccione un expediente.');
            return;
        }
        if (!this.tipoId) {
            this.error.set('Seleccione un tipo de audiencia.');
            return;
        }
        if (!this.estadoId) {
            this.error.set('Seleccione un estado.');
            return;
        }
        if (!this.fecha) {
            this.error.set('La fecha es obligatoria.');
            return;
        }
        if (!this.horaInicio) {
            this.error.set('La hora de inicio es obligatoria.');
            return;
        }
        if (!this.juzgadoId) {
            this.error.set('Seleccione un juzgado.');
            return;
        }

        this.guardando.set(true);
        this.audienciasSvc.crear({
            expedienteId: this.expedienteId,
            tipoId: this.tipoId,
            estadoId: this.estadoId,
            fecha: this.fecha,
            horaInicio: this.horaInicio,
            horaFin: this.horaFin || null,
            juzgadoId: this.juzgadoId,
            sala: this.sala.trim() || null,
            descripcionResultado: null,
            proximaActuacion: null,
            notas: this.notas.trim() || null,
            documentos: null
        }).subscribe({
            next: () => {
                this.guardando.set(false);
                this.toast.mostrar('Audiencia creada exitosamente.', 2600);
                this.creado.emit();
            },
            error: (err: any) => {
                this.guardando.set(false);
                this.error.set(err?.message || 'Error al crear la audiencia.');
                this.toast.mostrar(this.error(), 3000);
            }
        });
    }
}

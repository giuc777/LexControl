import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DiligenciasService } from '../../core/services/diligencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { DiligenciaCrear } from '../../core/models/diligencia.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-diligencia-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    templateUrl: './diligencia-modal.html'
})
export class DiligenciaModal implements OnInit {
    @Input() expedientes: { id: number; noExpediente: string }[] = [];
    @Input() clientes: { id: number; nombre: string }[] = [];
    @Input() fechaInicial: string | null = null;
    @Output() cerrar = new EventEmitter<void>();
    @Output() alCrear = new EventEmitter<void>();

    private readonly diligenciasSvc = inject(DiligenciasService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly tiposDiligencia = signal<CatalogoItem[]>([]);
    protected readonly estadosDiligencia = signal<CatalogoItem[]>([]);

    protected readonly expedienteId = signal<number | null>(null);
    protected readonly clienteId = signal<number | null>(null);
    protected readonly tipoId = signal<number>(0);
    protected readonly titulo = signal<string>('');
    protected readonly descripcion = signal<string>('');
    protected readonly fecha = signal<string>(new Date().toISOString().split('T')[0]);
    protected readonly horaInicio = signal<string>('');
    protected readonly diaCompleto = signal<boolean>(false);
    protected readonly ubicacion = signal<string>('');
    protected readonly oficina = signal<string>('');
    protected readonly estadoId = signal<number>(0);
    protected readonly notas = signal<string>('');
    protected readonly tiempoDedicado = signal<string>('');

    protected readonly guardando = signal(false);

    ngOnInit(): void {
        if (this.fechaInicial) {
            this.fecha.set(this.fechaInicial);
        }
        this.cargarCatalogos();
    }

    cargarCatalogos(): void {
        this.catalogosSvc.buscarCatalogo('TIPO_DILIGENCIA').subscribe({
            next: (data) => { this.tiposDiligencia.set(data.items); }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_DILIGENCIA').subscribe({
            next: (data) => {
                this.estadosDiligencia.set(data.items);
                const primerEstado = data.items.find(e => e.nombre === 'Pendiente') ?? data.items[0];
                if (primerEstado) this.estadoId.set(primerEstado.id);
            }
        });
    }

    onCerrar(): void { this.cerrar.emit(); }

    guardar(): void {
        if (!this.titulo().trim() || !this.tipoId() || !this.fecha()) {
            this.toast.mostrar('Complete los campos obligatorios.', 3000);
            return;
        }
        if (!this.clienteId()) {
            this.toast.mostrar('Seleccione un cliente.', 3000);
            return;
        }
        this.guardando.set(true);
        const dto: DiligenciaCrear = {
            expedienteId: this.expedienteId(),
            clienteId: this.clienteId(),
            tipoId: this.tipoId(),
            titulo: this.titulo().trim(),
            descripcion: this.descripcion() || null,
            fecha: this.fecha(),
            horaInicio: this.horaInicio() || null,
            diaCompleto: this.diaCompleto(),
            ubicacion: this.ubicacion() || null,
            oficina: this.oficina() || null,
            estadoId: this.estadoId(),
            notas: this.notas() || null,
            tiempoDedicado: this.tiempoDedicado() || null,
            recordatorioMinutos: 30
        };
        this.diligenciasSvc.crear(dto).subscribe({
            next: () => {
                this.toast.mostrar('Diligencia creada correctamente.', 3000);
                this.alCrear.emit();
            },
            error: () => {
                this.toast.mostrar('Error al crear la diligencia.', 3000);
                this.guardando.set(false);
            }
        });
    }
}

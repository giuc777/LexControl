import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NotificacionesService } from '../../core/services/notificaciones-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { NotificacionCrear } from '../../core/models/notificacion.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-notificacion-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    templateUrl: './notificacion-modal.html'
})
export class NotificacionModal implements OnInit {
    @Input() expedientes: { id: number; noExpediente: string }[] = [];
    @Input() juzgados: { id: number; nombre: string }[] = [];
    @Output() cerrar = new EventEmitter<void>();
    @Output() alCrear = new EventEmitter<void>();

    private readonly notificacionesSvc = inject(NotificacionesService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly tiposNotificacion = signal<CatalogoItem[]>([]);
    protected readonly estadosNotificacion = signal<CatalogoItem[]>([]);

    protected readonly expedienteId = signal<number>(0);
    protected readonly juzgadoId = signal<number>(0);
    protected readonly fechaRecepcion = signal<string>(new Date().toISOString().split('T')[0]);
    protected readonly tipoId = signal<number>(0);
    protected readonly contenido = signal<string>('');
    protected readonly resumen = signal<string>('');
    protected readonly estadoId = signal<number>(0);
    protected readonly numeroExpedienteOj = signal<string>('');
    protected readonly numeroResolucion = signal<string>('');
    protected readonly esResolucion = signal<boolean>(false);
    protected readonly favorable = signal<boolean | null>(null);
    protected readonly notas = signal<string>('');

    protected readonly guardando = signal(false);

    ngOnInit(): void {
        this.cargarCatalogos();
    }

    cargarCatalogos(): void {
        this.catalogosSvc.buscarCatalogo('TIPO_NOTIFICACION_OJ').subscribe({
            next: (data) => { this.tiposNotificacion.set(data.items); }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_NOTIFICACION_OJ').subscribe({
            next: (data) => {
                this.estadosNotificacion.set(data.items);
                const primerEstado = data.items.find(e => e.nombre === 'Pendiente') ?? data.items[0];
                if (primerEstado) this.estadoId.set(primerEstado.id);
            }
        });
    }

    onCerrar(): void { this.cerrar.emit(); }

    guardar(): void {
        if (!this.expedienteId() || !this.juzgadoId() || !this.tipoId() || !this.fechaRecepcion()) {
            this.toast.mostrar('Complete los campos obligatorios.', 3000);
            return;
        }
        this.guardando.set(true);
        const dto: NotificacionCrear = {
            expedienteId: this.expedienteId(),
            juzgadoId: this.juzgadoId(),
            fechaRecepcion: this.fechaRecepcion(),
            tipoId: this.tipoId(),
            contenido: this.contenido() || null,
            resumen: this.resumen() || null,
            estadoId: this.estadoId(),
            numeroExpedienteOj: this.numeroExpedienteOj() || null,
            pdfRuta: null,
            duplicadoDeId: null,
            notas: this.notas() || null,
            esResolucion: this.esResolucion(),
            numeroResolucion: this.numeroResolucion() || null,
            favorable: this.favorable()
        };
        this.notificacionesSvc.crear(dto).subscribe({
            next: () => {
                this.toast.mostrar('Notificacion creada correctamente.', 3000);
                this.alCrear.emit();
            },
            error: () => {
                this.toast.mostrar('Error al crear la notificacion.', 3000);
                this.guardando.set(false);
            }
        });
    }
}

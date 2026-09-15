import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TramitesService } from '../../core/services/tramites-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { TramiteCrear } from '../../core/models/tramite.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-tramite-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule],
    templateUrl: './tramite-modal.html'
})
export class TramiteModal implements OnInit {
    @Output() cerrar = new EventEmitter<void>();
    @Output() alCrear = new EventEmitter<void>();

    private readonly tramitesSvc = inject(TramitesService);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly expedientes = signal<{ id: number; noExpediente: string }[]>([]);
    protected readonly tiposTramite = signal<CatalogoItem[]>([]);
    protected readonly estadosTramite = signal<CatalogoItem[]>([]);

    protected readonly expedienteId = signal<number>(0);
    protected readonly tipoId = signal<number>(0);
    protected readonly institucion = signal<string>('');
    protected readonly fechaIngreso = signal<string>('');
    protected readonly estadoId = signal<number>(0);
    protected readonly descripcion = signal<string>('');
    protected readonly oficioReferencia = signal<string>('');
    protected readonly notasInternas = signal<string>('');

    protected readonly guardando = signal(false);

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarExpedientes();
    }

    cargarCatalogos(): void {
        this.catalogosSvc.buscarCatalogo('TIPO_TRAMITE').subscribe({
            next: (data) => {
                this.tiposTramite.set(data.items);
            }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_TRAMITE').subscribe({
            next: (data) => {
                this.estadosTramite.set(data.items);
                const primerEstado = data.items[0];
                if (primerEstado) this.estadoId.set(primerEstado.id);
            }
        });
    }

    cargarExpedientes(): void {
        this.expedientesSvc.listar({}).subscribe({
            next: (data) => {
                this.expedientes.set(data.expedientes.map((e: { id: number; noExpediente: string }) => ({ id: e.id, noExpediente: e.noExpediente })));
            }
        });
    }

    onCerrar(): void { this.cerrar.emit(); }

    guardar(): void {
        if (!this.expedienteId() || !this.tipoId() || !this.institucion().trim()) {
            this.toast.mostrar('Complete los campos obligatorios.', 3000);
            return;
        }
        this.guardando.set(true);
        const dto: TramiteCrear = {
            expedienteId: this.expedienteId(),
            tipoId: this.tipoId(),
            institucion: this.institucion().trim(),
            fechaIngreso: this.fechaIngreso() || null,
            estadoId: this.estadoId(),
            descripcion: this.descripcion() || null,
            oficioReferencia: this.oficioReferencia() || null,
            notasInternas: this.notasInternas() || null,
            documentosAdjuntos: null
        };
        this.tramitesSvc.crear(dto).subscribe({
            next: () => {
                this.toast.mostrar('Trámite creado correctamente.', 3000);
                this.alCrear.emit();
            },
            error: () => {
                this.toast.mostrar('Error al crear el trámite.', 3000);
                this.guardando.set(false);
            }
        });
    }
}

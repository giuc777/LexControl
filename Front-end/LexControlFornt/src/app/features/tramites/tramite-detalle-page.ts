import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TramitesService } from '../../core/services/tramites-service';
import { TramiteDetalle, TramiteActualizarEstado } from '../../core/models/tramite.model';
import { CatalogosService } from '../../core/services/catalogos-service';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Modal } from '../../shared/components/modal/modal';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-tramite-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, Modal],
    templateUrl: './tramite-detalle-page.html'
})
export class TramiteDetallePage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly tramitesSvc = inject(TramitesService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly tramite = signal<TramiteDetalle | null>(null);
    protected readonly cargando = signal(true);
    protected readonly estadosTramite = signal<CatalogoItem[]>([]);

    protected readonly mostrarFormEstado = signal(false);
    protected readonly nuevoEstadoId = signal<number>(0);
    protected readonly fechaResolucion = signal<string>('');
    protected readonly resumenResolucion = signal<string>('');
    protected readonly cambiando = signal(false);
    protected readonly error = signal('');

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) this.cargarDetalle(id);
        this.cargarEstados();
    }

    cargarDetalle(id: number): void {
        this.cargando.set(true);
        this.tramitesSvc.obtenerPorId(id).subscribe({
            next: (datos) => {
                this.tramite.set(datos);
                this.nuevoEstadoId.set(datos.estadoId);
                this.fechaResolucion.set(datos.fechaResolucion ?? '');
                this.resumenResolucion.set(datos.resumenResolucion ?? '');
                this.cargando.set(false);
            },
            error: () => {
                this.toast.mostrar('Error al cargar el trámite.', 3000);
                this.cargando.set(false);
            }
        });
    }

    cargarEstados(): void {
        this.catalogosSvc.buscarCatalogo('ESTADO_TRAMITE').subscribe({
            next: (data) => { this.estadosTramite.set(data.items); }
        });
    }

    irAVolver(): void {
        this.router.navigate(['/tramites']);
    }

    abrirFormEstado(): void {
        const t = this.tramite();
        if (!t) return;
        this.nuevoEstadoId.set(t.estadoId);
        this.fechaResolucion.set(t.fechaResolucion ?? '');
        this.resumenResolucion.set(t.resumenResolucion ?? '');
        this.error.set('');
        this.mostrarFormEstado.set(true);
    }

    cerrarFormEstado(): void {
        this.mostrarFormEstado.set(false);
        this.error.set('');
    }

    /* Nombre del estado elegido en el select (para la vista previa en color). */
    nombreEstado(): string {
        const id = this.nuevoEstadoId();
        if (!id) return '';
        return this.estadosTramite().find(e => e.id === id)?.nombre ?? '';
    }

    guardarEstado(): void {
        const id = this.tramite()?.id;
        if (!id || this.cambiando()) return;

        if (!this.nuevoEstadoId()) {
            this.error.set('Seleccione el nuevo estado del trámite.');
            return;
        }

        const dto: TramiteActualizarEstado = {
            estadoId: this.nuevoEstadoId(),
            fechaResolucion: this.fechaResolucion() || null,
            resumenResolucion: this.resumenResolucion() || null
        };

        this.cambiando.set(true);
        this.error.set('');
        this.tramitesSvc.actualizarEstado(id, dto).subscribe({
            next: () => {
                this.cambiando.set(false);
                this.toast.mostrar('Estado actualizado correctamente.', 3000);
                this.mostrarFormEstado.set(false);
                this.cargarDetalle(id);
            },
            error: (err) => {
                this.cambiando.set(false);
                this.error.set(err.error?.error || 'Error al actualizar el estado.');
            }
        });
    }

    colorEstado(estado: string): string {
        const colores: Record<string, string> = {
            'Ingresado': '#3498db',
            'En Proceso': '#f39c12',
            'Resuelto': '#2ecc71',
            'Rechazado': '#e74c3c'
        };
        return colores[estado] ?? '#6c757d';
    }

    esResuelto(): boolean {
        return this.tramite()?.estado === 'Resuelto' || this.tramite()?.estado === 'Rechazado';
    }
}

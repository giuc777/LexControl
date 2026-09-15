import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TramitesService } from '../../core/services/tramites-service';
import { TramiteDetalle, TramiteActualizarEstado } from '../../core/models/tramite.model';
import { CatalogosService } from '../../core/services/catalogos-service';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-tramite-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState],
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

    toggleFormEstado(): void {
        this.mostrarFormEstado.set(!this.mostrarFormEstado());
        const t = this.tramite();
        if (t) this.nuevoEstadoId.set(t.estadoId);
    }

    guardarEstado(): void {
        const id = this.tramite()?.id;
        if (!id) return;
        const dto: TramiteActualizarEstado = {
            estadoId: this.nuevoEstadoId(),
            fechaResolucion: this.fechaResolucion() || null,
            resumenResolucion: this.resumenResolucion() || null
        };
        this.tramitesSvc.actualizarEstado(id, dto).subscribe({
            next: () => {
                this.toast.mostrar('Estado actualizado correctamente.', 3000);
                this.mostrarFormEstado.set(false);
                this.cargarDetalle(id);
            },
            error: () => { this.toast.mostrar('Error al actualizar el estado.', 3000); }
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

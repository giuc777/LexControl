import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { DiligenciasService } from '../../core/services/diligencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { DiligenciaDetalle, DiligenciaActualizar } from '../../core/models/diligencia.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-diligencia-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState],
    templateUrl: './diligencia-detalle-page.html'
})
export class DiligenciaDetallePage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly diligenciasSvc = inject(DiligenciasService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly toast = inject(ToastService);

    protected readonly diligencia = signal<DiligenciaDetalle | null>(null);
    protected readonly cargando = signal(true);
    protected readonly estadosDiligencia = signal<CatalogoItem[]>([]);

    protected readonly mostrarFormEstado = signal(false);
    protected readonly nuevoEstadoId = signal<number>(0);

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) this.cargarDetalle(id);
        this.cargarEstados();
    }

    cargarDetalle(id: number): void {
        this.cargando.set(true);
        this.diligenciasSvc.obtenerPorId(id).subscribe({
            next: (datos) => {
                this.diligencia.set(datos);
                this.nuevoEstadoId.set(datos.estadoId);
                this.cargando.set(false);
            },
            error: () => {
                this.toast.mostrar('Error al cargar la diligencia.', 3000);
                this.cargando.set(false);
            }
        });
    }

    cargarEstados(): void {
        this.catalogosSvc.buscarCatalogo('ESTADO_DILIGENCIA').subscribe({
            next: (data) => { this.estadosDiligencia.set(data.items); }
        });
    }

    irAVolver(): void {
        this.router.navigate(['/diligencias']);
    }

    toggleFormEstado(): void {
        this.mostrarFormEstado.set(!this.mostrarFormEstado());
        const d = this.diligencia();
        if (d) this.nuevoEstadoId.set(d.estadoId);
    }

    guardarEstado(): void {
        const id = this.diligencia()?.id;
        if (!id) return;
        const dto: DiligenciaActualizar = {
            expedienteId: null,
            clienteId: null,
            tipoId: null,
            titulo: null,
            descripcion: null,
            fecha: null,
            horaInicio: null,
            diaCompleto: null,
            ubicacion: null,
            oficina: null,
            estadoId: this.nuevoEstadoId(),
            notas: null,
            tiempoDedicado: null,
            recordatorioMinutos: null
        };
        this.diligenciasSvc.actualizar(id, dto).subscribe({
            next: () => {
                this.toast.mostrar('Estado actualizado correctamente.', 3000);
                this.mostrarFormEstado.set(false);
                this.cargarDetalle(id);
            },
            error: () => { this.toast.mostrar('Error al actualizar el estado.', 3000); }
        });
    }

    eliminar(): void {
        const id = this.diligencia()?.id;
        if (!id) return;
        this.diligenciasSvc.eliminar(id).subscribe({
            next: () => {
                this.toast.mostrar('Diligencia cancelada.', 3000);
                this.irAVolver();
            },
            error: () => { this.toast.mostrar('Error al cancelar la diligencia.', 3000); }
        });
    }

    colorEstado(estado: string): string {
        const colores: Record<string, string> = {
            'Pendiente': '#f39c12',
            'En Progreso': '#3498db',
            'Completada': '#2ecc71',
            'Cancelada': '#e74c3c'
        };
        return colores[estado] ?? '#6c757d';
    }

    esCancelada(): boolean {
        return this.diligencia()?.estado === 'Cancelada';
    }
}

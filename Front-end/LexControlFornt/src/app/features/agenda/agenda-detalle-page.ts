import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AudienciasService } from '../../core/services/audiencias-service';
import { AudienciaDetalle } from '../../core/models/audiencia.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ResultadoModal } from './resultado-modal';
import { ToastService } from '../../layout/toast/toast-service';

@Component({
    selector: 'app-agenda-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [PageHeader, EmptyState, ResultadoModal],
    templateUrl: './agenda-detalle-page.html'
})
export class AgendaDetallePage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly audienciasSvc = inject(AudienciasService);
    private readonly toast = inject(ToastService);

    protected readonly audiencia = signal<AudienciaDetalle | null>(null);
    protected readonly cargando = signal(true);
    protected readonly modalAbierto = signal(false);

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) this.cargarDetalle(id);
    }

    cargarDetalle(id: number): void {
        this.cargando.set(true);
        this.audienciasSvc.obtenerPorId(id).subscribe({
            next: (datos) => { this.audiencia.set(datos); this.cargando.set(false); },
            error: () => {
                this.toast.mostrar('Error al cargar la audiencia.', 3000);
                this.cargando.set(false);
            }
        });
    }

    irAVolver(): void {
        this.router.navigate(['/agenda']);
    }

    abrirModalResultado(): void {
        this.modalAbierto.set(true);
    }

    cerrarModal(): void {
        this.modalAbierto.set(false);
    }

    alRegistrarResultado(): void {
        this.cerrarModal();
        const id = this.audiencia()?.id;
        if (id) this.cargarDetalle(id);
    }

    esPendiente(): boolean {
        const estado = this.audiencia()?.estado;
        return estado === 'Programada' || estado === 'Reprogramada';
    }

    colorEstado(estado: string): string {
        const colores: Record<string, string> = {
            'Programada': '#3498db',
            'Realizada': '#2ecc71',
            'Cancelada': '#e74c3c',
            'Suspendida': '#f39c12',
            'Reprogramada': '#f39c12'
        };
        return colores[estado] ?? '#6c757d';
    }
}

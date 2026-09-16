import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { HistoricoService } from '../../core/services/historico-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { HistoricoExpediente } from '../../core/models/historico.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';

@Component({
    selector: 'app-historico-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState],
    templateUrl: './historico-page.html'
})
export class HistoricoPage implements OnInit {
    private readonly historicoSvc = inject(HistoricoService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly router = inject(Router);

    protected readonly expedientes = signal<HistoricoExpediente[]>([]);
    protected readonly cargando = signal(false);

    protected readonly ramas = signal<CatalogoItem[]>([]);
    protected readonly filtroBusqueda = signal<string>('');
    protected readonly filtroRamaId = signal<number | null>(null);
    protected readonly filtroFechaInicio = signal<string>('');
    protected readonly filtroFechaFin = signal<string>('');

    ngOnInit(): void {
        this.cargarRamas();
        this.cargarExpedientes();
    }

    cargarRamas(): void {
        this.catalogosSvc.buscarCatalogo('RAMA').subscribe({
            next: (data) => { this.ramas.set(data.items); }
        });
    }

    cargarExpedientes(): void {
        this.cargando.set(true);
        const filtros: Record<string, number | string> = {};
        const busqueda = this.filtroBusqueda();
        const rama = this.filtroRamaId();
        const fi = this.filtroFechaInicio();
        const ff = this.filtroFechaFin();
        if (busqueda) filtros['busqueda'] = busqueda;
        if (rama) filtros['ramaId'] = rama;
        if (fi) filtros['fechaInicio'] = fi;
        if (ff) filtros['fechaFin'] = ff;
        this.historicoSvc.listar(filtros).subscribe({
            next: (datos) => { this.expedientes.set(datos); this.cargando.set(false); },
            error: () => { this.expedientes.set([]); this.cargando.set(false); }
        });
    }

    limpiarFiltros(): void {
        this.filtroBusqueda.set('');
        this.filtroRamaId.set(null);
        this.filtroFechaInicio.set('');
        this.filtroFechaFin.set('');
        this.cargarExpedientes();
    }

    irADetalle(id: number): void {
        this.router.navigate(['/historico', id]);
    }

    colorEstado(estado: string): string {
        if (estado === 'Cerrado') return '#B2845A';
        if (estado === 'Archivado') return '#95A5A6';
        return '#6c757d';
    }
}

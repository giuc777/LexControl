import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TramitesService } from '../../core/services/tramites-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { Tramite } from '../../core/models/tramite.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { TramiteModal } from './tramite-modal';

const COLORES_ESTADO: Record<string, string> = {
    'Ingresado': '#3498db',
    'En Proceso': '#f39c12',
    'Resuelto': '#2ecc71',
    'Rechazado': '#e74c3c'
};

@Component({
    selector: 'app-tramites-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, TramiteModal],
    templateUrl: './tramites-page.html'
})
export class TramitesPage implements OnInit {
    private readonly tramitesSvc = inject(TramitesService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly router = inject(Router);

    protected readonly tramites = signal<Tramite[]>([]);
    protected readonly cargando = signal(false);
    protected readonly modalAbierto = signal(false);

    protected readonly tiposTramite = signal<CatalogoItem[]>([]);
    protected readonly estadosTramite = signal<CatalogoItem[]>([]);

    protected readonly filtroExpedienteId = signal<number | null>(null);
    protected readonly filtroEstadoId = signal<number | null>(null);
    protected readonly filtroTipoId = signal<number | null>(null);
    protected readonly filtroFechaInicio = signal<string>('');
    protected readonly filtroFechaFin = signal<string>('');

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarTramites();
    }

    cargarCatalogos(): void {
        this.catalogosSvc.buscarCatalogo('TIPO_TRAMITE').subscribe({
            next: (data) => { this.tiposTramite.set(data.items); }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_TRAMITE').subscribe({
            next: (data) => { this.estadosTramite.set(data.items); }
        });
    }

    cargarTramites(): void {
        this.cargando.set(true);
        const filtros: Record<string, number | string> = {};
        const exp = this.filtroExpedienteId();
        const est = this.filtroEstadoId();
        const tipo = this.filtroTipoId();
        const fi = this.filtroFechaInicio();
        const ff = this.filtroFechaFin();
        if (exp) filtros['expedienteId'] = exp;
        if (est) filtros['estadoId'] = est;
        if (tipo) filtros['tipoId'] = tipo;
        if (fi) filtros['fechaInicio'] = fi;
        if (ff) filtros['fechaFin'] = ff;
        this.tramitesSvc.listar(filtros).subscribe({
            next: (datos) => { this.tramites.set(datos); this.cargando.set(false); },
            error: () => { this.tramites.set([]); this.cargando.set(false); }
        });
    }

    limpiarFiltros(): void {
        this.filtroExpedienteId.set(null);
        this.filtroEstadoId.set(null);
        this.filtroTipoId.set(null);
        this.filtroFechaInicio.set('');
        this.filtroFechaFin.set('');
        this.cargarTramites();
    }

    irADetalle(id: number): void {
        this.router.navigate(['/tramites', id]);
    }

    colorEstado(estado: string): string {
        return COLORES_ESTADO[estado] ?? '#6c757d';
    }

    abrirModal(): void { this.modalAbierto.set(true); }
    cerrarModal(): void { this.modalAbierto.set(false); }
    alCrearTramite(): void { this.cerrarModal(); this.cargarTramites(); }
}

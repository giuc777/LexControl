import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AudienciasService } from '../../core/services/audiencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { Audiencia } from '../../core/models/audiencia.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { AudienciaModal } from './audiencia-modal';

const COLORES_ESTADO: Record<string, string> = {
    'Programada': '#3498db',
    'Realizada': '#2ecc71',
    'Cancelada': '#e74c3c',
    'Suspendida': '#f39c12',
    'Reprogramada': '#f39c12'
};

@Component({
    selector: 'app-audiencias-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, AudienciaModal],
    templateUrl: './audiencias-page.html'
})
export class AudienciasPage implements OnInit {
    private readonly audienciasSvc = inject(AudienciasService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly router = inject(Router);

    protected readonly audiencias = signal<Audiencia[]>([]);
    protected readonly cargando = signal(false);
    protected readonly modalAbierto = signal(false);

    protected readonly tiposAudiencia = signal<CatalogoItem[]>([]);
    protected readonly estadosAudiencia = signal<CatalogoItem[]>([]);
    protected readonly expedientes = signal<{ id: number; noExpediente: string }[]>([]);

    protected readonly filtroTipoId = signal<number | null>(null);
    protected readonly filtroEstadoId = signal<number | null>(null);
    protected readonly filtroExpedienteId = signal<number | null>(null);
    protected readonly filtroFechaInicio = signal<string>('');
    protected readonly filtroFechaFin = signal<string>('');

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarExpedientes();
        this.cargarAudiencias();
    }

    cargarCatalogos(): void {
        this.catalogosSvc.buscarCatalogo('TIPO_AUDIENCIA').subscribe({
            next: (data) => { this.tiposAudiencia.set(data.items); }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_AUDIENCIA').subscribe({
            next: (data) => { this.estadosAudiencia.set(data.items); }
        });
    }

    cargarExpedientes(): void {
        this.expedientesSvc.listar({}).subscribe({
            next: (data) => {
                this.expedientes.set(
                    data.expedientes.map((e: { id: number; noExpediente: string }) => ({
                        id: e.id,
                        noExpediente: e.noExpediente
                    }))
                );
            }
        });
    }

    cargarAudiencias(): void {
        this.cargando.set(true);
        const filtros: Record<string, number | string> = {};
        const tipo = this.filtroTipoId();
        const estado = this.filtroEstadoId();
        const exp = this.filtroExpedienteId();
        const fi = this.filtroFechaInicio();
        const ff = this.filtroFechaFin();
        if (tipo) filtros['tipoId'] = tipo;
        if (estado) filtros['estadoId'] = estado;
        if (exp) filtros['expedienteId'] = exp;
        if (fi) filtros['fechaInicio'] = fi;
        if (ff) filtros['fechaFin'] = ff;
        this.audienciasSvc.listar(filtros).subscribe({
            next: (datos) => { this.audiencias.set(datos); this.cargando.set(false); },
            error: () => { this.audiencias.set([]); this.cargando.set(false); }
        });
    }

    limpiarFiltros(): void {
        this.filtroTipoId.set(null);
        this.filtroEstadoId.set(null);
        this.filtroExpedienteId.set(null);
        this.filtroFechaInicio.set('');
        this.filtroFechaFin.set('');
        this.cargarAudiencias();
    }

    irADetalle(id: number): void {
        this.router.navigate(['/agenda', id]);
    }

    irAAgenda(): void {
        this.router.navigate(['/agenda']);
    }

    colorEstado(estado: string): string {
        return COLORES_ESTADO[estado] ?? '#6c757d';
    }

    formatearHora(hora: string | null): string {
        if (!hora) return '';
        const partes = hora.split(':');
        if (partes.length >= 2) return `${partes[0]}:${partes[1]}`;
        return hora;
    }

    abrirModal(): void { this.modalAbierto.set(true); }

    cerrarModal(): void { this.modalAbierto.set(false); }

    alCrearAudiencia(): void {
        this.cerrarModal();
        this.cargarAudiencias();
    }
}

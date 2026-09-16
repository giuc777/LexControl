import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { DiligenciasService } from '../../core/services/diligencias-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { ClientesService } from '../../core/services/clientes-service';
import { Diligencia } from '../../core/models/diligencia.model';
import { CatalogoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { DiligenciaModal } from './diligencia-modal';

const COLORES_ESTADO: Record<string, string> = {
    'Pendiente': '#f39c12',
    'En Progreso': '#3498db',
    'Completada': '#2ecc71',
    'Cancelada': '#e74c3c'
};

@Component({
    selector: 'app-diligencias-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, DiligenciaModal],
    templateUrl: './diligencias-page.html'
})
export class DiligenciasPage implements OnInit {
    private readonly diligenciasSvc = inject(DiligenciasService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly clientesSvc = inject(ClientesService);
    private readonly router = inject(Router);

    protected readonly diligencias = signal<Diligencia[]>([]);
    protected readonly cargando = signal(false);
    protected readonly modalAbierto = signal(false);

    protected readonly tiposDiligencia = signal<CatalogoItem[]>([]);
    protected readonly estadosDiligencia = signal<CatalogoItem[]>([]);
    protected readonly expedientes = signal<{ id: number; noExpediente: string }[]>([]);
    protected readonly clientes = signal<{ id: number; nombre: string }[]>([]);

    protected readonly filtroTipoId = signal<number | null>(null);
    protected readonly filtroEstadoId = signal<number | null>(null);
    protected readonly filtroExpedienteId = signal<number | null>(null);
    protected readonly filtroFechaInicio = signal<string>('');
    protected readonly filtroFechaFin = signal<string>('');

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarExpedientes();
        this.cargarClientes();
        this.cargarDiligencias();
    }

    cargarCatalogos(): void {
        this.catalogosSvc.buscarCatalogo('TIPO_DILIGENCIA').subscribe({
            next: (data) => { this.tiposDiligencia.set(data.items); }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_DILIGENCIA').subscribe({
            next: (data) => { this.estadosDiligencia.set(data.items); }
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

    cargarClientes(): void {
        this.clientesSvc.listar({}).subscribe({
            next: (data) => {
                this.clientes.set(
                    data.clientes.map((c: { id: number; nombreCompleto: string }) => ({
                        id: c.id,
                        nombre: c.nombreCompleto
                    }))
                );
            }
        });
    }

    cargarDiligencias(): void {
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
        this.diligenciasSvc.listar(filtros).subscribe({
            next: (datos) => { this.diligencias.set(datos); this.cargando.set(false); },
            error: () => { this.diligencias.set([]); this.cargando.set(false); }
        });
    }

    limpiarFiltros(): void {
        this.filtroTipoId.set(null);
        this.filtroEstadoId.set(null);
        this.filtroExpedienteId.set(null);
        this.filtroFechaInicio.set('');
        this.filtroFechaFin.set('');
        this.cargarDiligencias();
    }

    irADetalle(id: number): void {
        this.router.navigate(['/diligencias', id]);
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
    alCrearDiligencia(): void { this.cerrarModal(); this.cargarDiligencias(); }
}

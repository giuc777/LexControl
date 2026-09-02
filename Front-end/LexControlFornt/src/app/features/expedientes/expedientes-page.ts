import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ExpedientesService } from '../../core/services/expedientes-service';
import { ExpedienteCrearDto, ExpedienteActualizarDto, ExpedienteLista } from '../../core/models/expediente.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Paginacion } from '../../shared/components/paginacion/paginacion';
import { ExpedienteModal } from './expediente-modal';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
    selector: 'app-expedientes-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, Paginacion, ExpedienteModal],
    templateUrl: './expedientes-page.html'
})
export class ExpedientesPage implements OnInit {
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly router = inject(Router);

    protected readonly expedientes = signal<ExpedienteLista[]>([]);
    protected readonly total = signal(0);
    protected readonly paginaActual = signal(1);
    protected readonly cargando = signal(false);
    protected readonly modalAbierto = signal(false);

    protected readonly tamanioPagina = 7;
    protected filtroRama = '';
    protected filtroEstado = '';
    protected filtroBusqueda = '';

    ngOnInit(): void {
        this.cargarExpedientes();
    }

    formatearFecha(iso: string | null): string {
        if (!iso) return '—';
        const partes = iso.split('T')[0].split('-');
        if (partes.length !== 3) return iso;
        return `${parseInt(partes[2], 10)} ${MESES_CORTO[parseInt(partes[1], 10) - 1]} ${partes[0]}`;
    }

    alCambiarFiltroRama(valor: string): void {
        this.filtroRama = valor;
        this.paginaActual.set(1);
        this.cargarExpedientes();
    }

    alCambiarFiltroEstado(valor: string): void {
        this.filtroEstado = valor;
        this.paginaActual.set(1);
        this.cargarExpedientes();
    }

    alBuscar(valor: string): void {
        this.filtroBusqueda = valor;
        this.paginaActual.set(1);
        this.cargarExpedientes();
    }

    alPaginar(pagina: number): void {
        this.paginaActual.set(pagina);
        this.cargarExpedientes();
    }

    abrirModal(): void {
        this.modalAbierto.set(true);
    }

    cerrarModal(): void {
        this.modalAbierto.set(false);
    }

    alGuardar(datos: ExpedienteCrearDto | ExpedienteActualizarDto): void {
        this.expedientesSvc.crear(datos as ExpedienteCrearDto).subscribe({
            next: () => {
                this.cerrarModal();
                this.paginaActual.set(1);
                this.cargarExpedientes();
            }
        });
    }

    irADetalle(id: number): void {
        this.router.navigate(['/expedientes', id]);
    }

    private cargarExpedientes(): void {
        this.cargando.set(true);
        this.expedientesSvc.listar({
            ramaId: this.filtroRama ? Number(this.filtroRama) : null,
            estadoId: this.filtroEstado ? Number(this.filtroEstado) : null,
            noExpediente: this.filtroBusqueda || null,
            pagina: this.paginaActual(),
            tamanioPagina: this.tamanioPagina
        }).subscribe({
            next: resultado => {
                this.expedientes.set(resultado.expedientes);
                this.total.set(resultado.total);
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false)
        });
    }
}

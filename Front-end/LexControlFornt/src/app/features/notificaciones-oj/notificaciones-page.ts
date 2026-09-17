import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NotificacionesService } from '../../core/services/notificaciones-service';
import { CatalogosService } from '../../core/services/catalogos-service';
import { ExpedientesService } from '../../core/services/expedientes-service';
import { NotificacionLista } from '../../core/models/notificacion.model';
import { CatalogoItem, JuzgadoItem } from '../../core/models/catalogo.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { NotificacionModal } from './notificacion-modal';

const COLORES_ESTADO: Record<string, string> = {
    'Pendiente': '#f39c12',
    'En Tramite': '#3498db',
    'Atendida': '#2ecc71',
    'Vencida': '#e74c3c',
    'Rechazada': '#95a5a6'
};

@Component({
    selector: 'app-notificaciones-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, EmptyState, NotificacionModal],
    templateUrl: './notificaciones-page.html'
})
export class NotificacionesPage implements OnInit {
    private readonly notificacionesSvc = inject(NotificacionesService);
    private readonly catalogosSvc = inject(CatalogosService);
    private readonly expedientesSvc = inject(ExpedientesService);
    private readonly router = inject(Router);

    protected readonly notificaciones = signal<NotificacionLista[]>([]);
    protected readonly cargando = signal(false);
    protected readonly mostrarModal = signal(false);

    protected readonly tiposNotificacion = signal<CatalogoItem[]>([]);
    protected readonly estadosNotificacion = signal<CatalogoItem[]>([]);
    protected readonly expedientes = signal<{ id: number; noExpediente: string }[]>([]);
    protected readonly juzgados = signal<{ id: number; nombre: string }[]>([]);

    protected readonly filtroTipoId = signal<number | null>(null);
    protected readonly filtroEstadoId = signal<number | null>(null);
    protected readonly filtroExpedienteId = signal<number | null>(null);
    protected readonly filtroFechaInicio = signal<string>('');
    protected readonly filtroFechaFin = signal<string>('');

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarExpedientes();
        this.cargarJuzgados();
        this.cargarNotificaciones();
    }

    cargarCatalogos(): void {
        this.catalogosSvc.buscarCatalogo('TIPO_NOTIFICACION_OJ').subscribe({
            next: (data) => { this.tiposNotificacion.set(data.items); }
        });
        this.catalogosSvc.buscarCatalogo('ESTADO_NOTIFICACION_OJ').subscribe({
            next: (data) => { this.estadosNotificacion.set(data.items); }
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

    cargarJuzgados(): void {
        this.catalogosSvc.buscarJuzgados({}).subscribe({
            next: (data) => {
                this.juzgados.set(
                    data.items.map((j: JuzgadoItem) => ({ id: j.id, nombre: j.nombre }))
                );
            }
        });
    }

    cargarNotificaciones(): void {
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
        this.notificacionesSvc.listar(filtros).subscribe({
            next: (datos) => { this.notificaciones.set(datos); this.cargando.set(false); },
            error: () => { this.notificaciones.set([]); this.cargando.set(false); }
        });
    }

    limpiarFiltros(): void {
        this.filtroTipoId.set(null);
        this.filtroEstadoId.set(null);
        this.filtroExpedienteId.set(null);
        this.filtroFechaInicio.set('');
        this.filtroFechaFin.set('');
        this.cargarNotificaciones();
    }

    abrirModal(): void {
        this.mostrarModal.set(true);
    }

    cerrarModal(): void {
        this.mostrarModal.set(false);
    }

    alGuardar(): void {
        this.mostrarModal.set(false);
        this.cargarNotificaciones();
    }

    irADetalle(id: number): void {
        this.router.navigate(['/notificaciones-oj', id]);
    }

    colorEstado(estado: string): string {
        return COLORES_ESTADO[estado] ?? '#6c757d';
    }

    esPendiente(estado: string): boolean {
        return estado !== 'Atendida';
    }

    textoFavorable(favorable: boolean | null): string {
        if (favorable === null) return '--';
        return favorable ? 'Favorable' : 'Desfavorable';
    }
}
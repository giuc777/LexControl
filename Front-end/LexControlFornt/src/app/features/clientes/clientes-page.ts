import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ClientesService } from '../../core/services/clientes-service';
import { ClienteEstadisticas, ClienteLista } from '../../core/models/cliente.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { BadgeEstado } from '../../shared/components/badge-estado/badge-estado';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { Paginacion } from '../../shared/components/paginacion/paginacion';
import { ClienteModal } from './cliente-modal';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLORES_AVATAR = ['#2a6b77', '#b2845a', '#7a8b3a', '#8a5a9e', '#3a7a5a', '#a15c2b', '#4a6da8', '#b0322a'];

/* Página de listado de clientes. Replica Pototipo/clientes.html
   con paginación server-side y conexión al API real. */
@Component({
    selector: 'app-clientes-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, PageHeader, StatCard, BadgeEstado, EmptyState, Paginacion, ClienteModal],
    templateUrl: './clientes-page.html'
})
export class ClientesPage implements OnInit {
    private readonly clientesSvc = inject(ClientesService);
    private readonly router = inject(Router);

    protected readonly clientes = signal<ClienteLista[]>([]);
    protected readonly estadisticas = signal<ClienteEstadisticas | null>(null);
    protected readonly total = signal(0);
    protected readonly paginaActual = signal(1);
    protected readonly cargando = signal(false);
    protected readonly modalAbierto = signal(false);

    protected filtroEstado = '';
    protected readonly tamanioPagina = 6;

    ngOnInit(): void {
        this.cargarEstadisticas();
        this.cargarClientes();
    }

    /* Helpers de formato replicados del prototipo (clientes-comun.js). */
    iniciales(nombre: string): string {
        const partes = (nombre ?? '').trim().split(/\s+/);
        if (partes.length === 0 || partes[0] === '') return '--';
        if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
        return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
    }

    colorAvatar(nombre: string): string {
        let total = 0;
        for (const c of nombre ?? '') total += c.charCodeAt(0);
        return COLORES_AVATAR[total % COLORES_AVATAR.length];
    }

    formatearDpi(dpi: string | null): string {
        if (!dpi) return '—';
        const dig = dpi.replace(/\D/g, '');
        if (dig.length !== 13) return dpi;
        return `${dig.substring(0, 4)} ${dig.substring(4, 9)} ${dig.substring(9, 13)}`;
    }

    formatearFecha(iso: string | null): string {
        if (!iso) return '—';
        const partes = iso.split('-');
        if (partes.length !== 3) return iso;
        return `${parseInt(partes[2], 10)} ${MESES_CORTO[parseInt(partes[1], 10) - 1]} ${partes[0]}`;
    }

    alCambiarFiltroEstado(evento: Event): void {
        const valor = (evento.target as HTMLSelectElement).value;
        this.filtroEstado = valor;
        this.paginaActual.set(1);
        this.cargarClientes();
    }

    alPaginar(pagina: number): void {
        this.paginaActual.set(pagina);
        this.cargarClientes();
    }

    abrirModal(): void {
        this.modalAbierto.set(true);
    }

    cerrarModal(): void {
        this.modalAbierto.set(false);
    }

    alGuardar(datos: any): void {
        this.clientesSvc.crear(datos).subscribe({
            next: () => {
                this.cerrarModal();
                this.paginaActual.set(1);
                this.cargarClientes();
                this.cargarEstadisticas();
            },
            error: () => {}
        });
    }

    irADetalle(id: number): void {
        this.router.navigate(['/clientes', id]);
    }

    private cargarEstadisticas(): void {
        this.clientesSvc.estadisticas().subscribe({
            next: stats => this.estadisticas.set(stats)
        });
    }

    private cargarClientes(): void {
        this.cargando.set(true);
        const filtroEstado = this.filtroEstado === 'Activo' ? true
            : this.filtroEstado === 'Inactivo' ? false
            : null;

        this.clientesSvc.listar({
            filtroEstado,
            pagina: this.paginaActual(),
            tamanioPagina: this.tamanioPagina
        }).subscribe({
            next: resultado => {
                this.clientes.set(resultado.clientes);
                this.total.set(resultado.total);
                this.cargando.set(false);
            },
            error: () => this.cargando.set(false)
        });
    }
}

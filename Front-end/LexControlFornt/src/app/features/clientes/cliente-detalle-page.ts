import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ClientesService } from '../../core/services/clientes-service';
import { ClienteDetalle, ClienteExpediente } from '../../core/models/cliente.model';
import { BadgeEstado } from '../../shared/components/badge-estado/badge-estado';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { ClienteModal } from './cliente-modal';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLORES_AVATAR = ['#2a6b77', '#b2845a', '#7a8b3a', '#8a5a9e', '#3a7a5a', '#a15c2b', '#4a6da8', '#b0322a'];

/* Página de detalle de un cliente. Replica Pototipo/clientes-detalle.html
   con conexión al API real y tabla de expedientes. */
@Component({
    selector: 'app-cliente-detalle-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, BadgeEstado, EmptyState, ClienteModal],
    templateUrl: './cliente-detalle-page.html'
})
export class ClienteDetallePage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly clientesSvc = inject(ClientesService);

    protected readonly cliente = signal<ClienteDetalle | null>(null);
    protected readonly expedientes = signal<ClienteExpediente[]>([]);
    protected readonly cargando = signal(true);
    protected readonly modalAbierto = signal(false);

    private clienteId = 0;

    ngOnInit(): void {
        this.clienteId = Number(this.route.snapshot.paramMap.get('id'));
        if (!this.clienteId) {
            this.router.navigate(['/clientes']);
            return;
        }
        this.cargarCliente();
        this.cargarExpedientes();
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

    generoTexto(genero: string | null): string {
        if (genero === 'M') return 'Masculino';
        if (genero === 'F') return 'Femenino';
        if (genero === 'O') return 'Otro';
        return '—';
    }

    varianteEstado(estado: string): 'activo' | 'tramite' | 'finalizado' {
        const e = (estado ?? '').toUpperCase();
        if (e === 'ACTIVO') return 'activo';
        if (e === 'EN TRÁMITE' || e === 'EN TRAMITE') return 'tramite';
        return 'finalizado';
    }

    abrirModalEdicion(): void {
        this.modalAbierto.set(true);
    }

    cerrarModal(): void {
        this.modalAbierto.set(false);
    }

    alGuardar(datos: any): void {
        this.clientesSvc.actualizar(this.clienteId, datos).subscribe({
            next: () => {
                this.cerrarModal();
                this.cargarCliente();
            }
        });
    }

    private cargarCliente(): void {
        this.clientesSvc.obtenerPorId(this.clienteId).subscribe({
            next: cliente => {
                this.cliente.set(cliente);
                this.cargando.set(false);
            },
            error: () => this.router.navigate(['/clientes'])
        });
    }

    private cargarExpedientes(): void {
        this.clientesSvc.obtenerExpedientes(this.clienteId).subscribe({
            next: exps => this.expedientes.set(exps)
        });
    }
}

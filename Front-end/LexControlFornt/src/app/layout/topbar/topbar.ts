import { ChangeDetectionStrategy, Component, computed, inject, output, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth-service';
import { PermisosService } from '../../core/permisos/permisos';
import { BuscarService } from '../../core/services/buscar-service';
import { NotificacionesService } from '../../core/services/notificaciones-service';
import { BusquedaResultado } from '../../core/models/busqueda.model';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';

const ICONO_SEARCH = 'M11 11a7 7 0 1 0 0-2M21 21l-4.35-4.35';
const ICONO_BELL = 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0';
const ICONO_MENU = 'M4 6h16M4 12h16M4 18h16';

@Component({
    selector: 'app-topbar',
    imports: [IconoSvg],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'app-topbar' },
    templateUrl: './topbar.html'
})
export class Topbar implements OnInit, OnDestroy {
    private readonly permisos = inject(PermisosService);
    private readonly router = inject(Router);
    private readonly buscarSvc = inject(BuscarService);
    private readonly notificacionesSvc = inject(NotificacionesService);

    readonly auth = inject(AuthService);
    readonly menuToggle = output<void>();

    readonly iconoSearch = ICONO_SEARCH;
    readonly iconoBell = ICONO_BELL;
    readonly iconoMenu = ICONO_MENU;

    readonly mostrarOj = computed(() => this.permisos.tiene('notificaciones'));
    readonly iniciales = computed(() => obtenerIniciales(this.auth.nombre() || 'Administrador del Sistema'));

    /* --- Búsqueda --- */
    readonly busquedaQuery = signal('');
    readonly resultadosBusqueda = signal<BusquedaResultado | null>(null);
    readonly mostrarResultados = signal(false);
    private busquedaTimeout: ReturnType<typeof setTimeout> | null = null;

    /* --- Notificaciones --- */
    readonly pendientes = signal(0);

    private intervalo: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        this.cargarPendientes();
        this.intervalo = setInterval(() => this.cargarPendientes(), 60_000);
    }

    ngOnDestroy(): void {
        if (this.busquedaTimeout) clearTimeout(this.busquedaTimeout);
        if (this.intervalo) clearInterval(this.intervalo);
    }

    /* Búsqueda con debounce de 300ms. */
    onBusquedaInput(valor: string): void {
        this.busquedaQuery.set(valor);
        this.mostrarResultados.set(valor.length >= 2);

        if (this.busquedaTimeout) clearTimeout(this.busquedaTimeout);
        if (valor.length < 2) {
            this.resultadosBusqueda.set(null);
            return;
        }
        this.busquedaTimeout = setTimeout(() => {
            this.buscarSvc.buscar(valor).subscribe(r => this.resultadosBusqueda.set(r));
        }, 300);
    }

    cerrarResultados(): void {
        setTimeout(() => this.mostrarResultados.set(false), 200);
    }

    navegarResultado(ruta: string): void {
        this.mostrarResultados.set(false);
        this.busquedaQuery.set('');
        this.router.navigateByUrl(ruta);
    }

    /* Notificaciones */
    verNotificaciones(): void {
        this.router.navigateByUrl('/notificaciones-oj');
    }

    verPortalOj(evento: Event): void {
        evento.preventDefault();
        this.router.navigateByUrl('/notificaciones-oj');
    }

    private cargarPendientes(): void {
        this.notificacionesSvc.contarPendientes().subscribe({
            next: count => this.pendientes.set(count),
            error: () => this.pendientes.set(0)
        });
    }
}

function obtenerIniciales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

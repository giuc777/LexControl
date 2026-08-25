import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PermisosService } from '../../core/permisos/permisos';
import { Sidebar } from '../sidebar/sidebar';
import { Toast } from '../toast/toast';
import { Topbar } from '../topbar/topbar';

/* Contenedor principal autenticado: sidebar + topbar + router-outlet.
   El host lleva la clase .app-shell que usa styles/layout.css. */
@Component({
    selector: 'app-shell',
    imports: [RouterOutlet, Sidebar, Topbar, Toast],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'app-shell',
        '[class.sidebar-open]': 'menuAbierto()',
        '(document:click)': 'cerrarMenuSiFuera($event)'
    },
    templateUrl: './shell.html'
})
export class Shell {
    private readonly permisos = inject(PermisosService);

    readonly menuAbierto = signal(false);

    constructor() {
        /* Carga el menú del rol (GET /api/permisos/{rolId}) al entrar al área
           autenticada; sidebar y guards consumen el resultado cacheado. */
        this.permisos.cargarMenu().subscribe();
    }

    alternarMenu(): void {
        this.menuAbierto.update(abierto => !abierto);
    }

    /* Cierra el sidebar móvil al hacer click fuera de él (igual que layout.js). */
    cerrarMenuSiFuera(evento: Event): void {
        if (!this.menuAbierto()) return;

        const destino = evento.target as HTMLElement | null;
        if (destino?.closest('.app-sidebar') || destino?.closest('.btn-menu-toggle')) return;

        this.menuAbierto.set(false);
    }
}

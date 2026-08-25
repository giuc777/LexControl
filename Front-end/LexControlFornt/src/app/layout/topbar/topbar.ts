import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';

import { AuthService } from '../../core/auth/auth-service';
import { PermisosService } from '../../core/permisos/permisos';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { ToastService } from '../toast/toast-service';

const ICONO_SEARCH = 'M11 11a7 7 0 1 0 0-2M21 21l-4.35-4.35';
const ICONO_BELL = 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0';
const ICONO_MENU = 'M4 6h16M4 12h16M4 18h16';

@Component({
    selector: 'app-topbar',
    imports: [IconoSvg],
    changeDetection: ChangeDetectionStrategy.OnPush,
    /* El host lleva la clase que usa styles/layout.css (equivalente a header.app-topbar del prototipo). */
    host: { class: 'app-topbar' },
    templateUrl: './topbar.html'
})
export class Topbar {
    private readonly toast = inject(ToastService);
    private readonly permisos = inject(PermisosService);

    readonly auth = inject(AuthService);

    /* El shell escucha este output para abrir/cerrar el sidebar en móvil. */
    readonly menuToggle = output<void>();

    readonly iconoSearch = ICONO_SEARCH;
    readonly iconoBell = ICONO_BELL;
    readonly iconoMenu = ICONO_MENU;

    readonly mostrarOj = computed(() => this.permisos.tiene('notificaciones'));

    readonly iniciales = computed(() => obtenerIniciales(this.auth.nombre() || 'Administrador del Sistema'));

    verNotificaciones(): void {
        this.toast.mostrar('Tienes 3 notificaciones pendientes');
    }

    verPortalOj(evento: Event): void {
        evento.preventDefault();
        this.toast.mostrar('Portal OJ Online próximamente');
    }
}

function obtenerIniciales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

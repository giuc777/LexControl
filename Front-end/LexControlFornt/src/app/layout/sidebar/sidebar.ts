import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth/auth-service';
import { PermisosService, iconoDe } from '../../core/permisos/permisos';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';

const ICONO_LOGOUT = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9';

/* Barra lateral: módulos visibles para el rol de la sesión.
   La lista viene de PermisosService (GET /api/permisos/{rolId}) y se
   actualiza en vivo si el administrador guarda cambios sobre su rol. */
@Component({
    selector: 'app-sidebar',
    imports: [RouterLink, RouterLinkActive, IconoSvg],
    changeDetection: ChangeDetectionStrategy.OnPush,
    /* El host lleva la clase que usa styles/layout.css (equivalente a aside.app-sidebar del prototipo). */
    host: { class: 'app-sidebar' },
    templateUrl: './sidebar.html'
})
export class Sidebar {
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly permisos = inject(PermisosService);

    readonly items = computed(() =>
        this.permisos.menu().map(modulo => ({
            ruta: modulo.ruta,
            label: modulo.nombre,
            icon: iconoDe(modulo.icono)
        }))
    );

    readonly iconoLogout = ICONO_LOGOUT;

    cerrarSesion(): void {
        this.auth.cerrarSesion();
        this.router.navigateByUrl('/login');
    }
}

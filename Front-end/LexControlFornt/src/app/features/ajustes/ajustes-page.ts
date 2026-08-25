import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthService } from '../../core/auth/auth-service';
import { BufeteCard } from './bufete-card';
import { PerfilCard } from './perfil-card';
import { PermisosCard } from './permisos-card';
import { PreferenciasCard } from './preferencias-card';
import { SeguridadCard } from './seguridad-card';
import { UsuariosCard } from './usuarios-card';

/* Módulo Ajustes — réplica de Pototipo/ajustes.html + ajustes.js.
   Las secciones de administración (Usuarios/Permisos/Bufete/Preferencias)
   solo se muestran al rol Administrador, igual que renderAll() del prototipo;
   el backend además responde 403 a cualquier intento no autorizado. */
@Component({
    selector: 'app-ajustes-page',
    imports: [
        PerfilCard,
        PreferenciasCard,
        UsuariosCard,
        PermisosCard,
        BufeteCard,
        SeguridadCard
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './ajustes-page.html'
})
export class AjustesPage {
    private readonly auth = inject(AuthService);

    readonly esAdmin = computed(() => this.auth.rol() === 'Administrador');
}

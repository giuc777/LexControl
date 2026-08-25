import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ToastService } from '../../layout/toast/toast-service';
import { IconoSvg } from '../../shared/components/icono-svg/icono-svg';
import { ICONO_CAMPANA } from './ajustes-iconos';

interface Preferencia {
    clave: string;
    titulo: string;
    descripcion: string;
    activo: boolean;
}

const CLAVE_STORAGE = 'lexcontrol_preferencias';

/* MOCK: pendiente endpoint /api/configuracion en el backend (agents.md §11).
   Réplica de Pototipo/js/ajustes-comun.js PREFERENCIAS; la persistencia es
   local al navegador mientras no exista la tabla/endpoint real. */
const PREFERENCIAS_SEED: readonly Preferencia[] = [
    { clave: 'NotificacionesCorreo', titulo: 'Notificaciones por correo', descripcion: 'Recibir avisos legales', activo: true },
    { clave: 'AlertasVencimiento', titulo: 'Alertas de vencimiento', descripcion: 'Avisos de audiencias', activo: true }
];

@Component({
    selector: 'app-preferencias-card',
    imports: [IconoSvg],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './preferencias-card.html'
})
export class PreferenciasCard {
    private readonly toast = inject(ToastService);

    protected readonly iconoCampana = ICONO_CAMPANA;
    protected readonly preferencias = signal<Preferencia[]>(this.leer());

    alternar(preferencia: Preferencia): void {
        this.preferencias.update(lista =>
            lista.map(p => p.clave === preferencia.clave ? { ...p, activo: !p.activo } : p)
        );

        try {
            localStorage.setItem(CLAVE_STORAGE, JSON.stringify(this.preferencias()));
        } catch {
            /* almacenamiento no disponible: se conserva solo en memoria */
        }

        const actualizada = this.preferencias().find(p => p.clave === preferencia.clave);
        if (actualizada) {
            this.toast.mostrar(`Preferencia "${actualizada.titulo}" ${actualizada.activo ? 'activada' : 'desactivada'}.`);
        }
    }

    private leer(): Preferencia[] {
        try {
            const guardadas = JSON.parse(localStorage.getItem(CLAVE_STORAGE) ?? 'null') as Record<string, boolean> | null;
            if (!guardadas) return [...PREFERENCIAS_SEED];

            return PREFERENCIAS_SEED.map(p => ({ ...p, activo: guardadas[p.clave] ?? p.activo }));
        } catch {
            return [...PREFERENCIAS_SEED];
        }
    }
}

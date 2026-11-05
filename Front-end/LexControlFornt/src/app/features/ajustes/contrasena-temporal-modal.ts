import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

import { Modal } from '../../shared/components/modal/modal';

/* Modal «Contraseña temporal»: muestra una sola vez la clave generada al
   crear o restablecer un usuario, con botón para copiarla. */
@Component({
    selector: 'app-contrasena-temporal-modal',
    imports: [Modal],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './contrasena-temporal-modal.html'
})
export class ContrasenaTemporalModal {
    readonly abierto = input.required<boolean>();
    readonly cuenta = input('');
    readonly contrasena = input('');
    readonly cerrado = output<void>();

    protected readonly copiado = signal(false);
    protected readonly errorCopia = signal(false);

    constructor() {
        /* Al reabrir vuelve al estado inicial. */
        effect(() => {
            if (!this.abierto()) return;
            this.copiado.set(false);
            this.errorCopia.set(false);
        });
    }

    cerrar(): void {
        this.cerrado.emit();
    }

    async copiar(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.contrasena());
            this.copiado.set(true);
            this.errorCopia.set(false);
        } catch {
            this.copiado.set(false);
            this.errorCopia.set(true);
        }
    }
}

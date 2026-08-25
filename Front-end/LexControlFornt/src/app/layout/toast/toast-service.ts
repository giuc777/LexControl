import { Injectable, signal } from '@angular/core';

/* Reemplazo de window.lexToast del prototipo (layout.js). */
@Injectable({ providedIn: 'root' })
export class ToastService {
    private readonly _mensaje = signal('');
    private readonly _visible = signal(false);
    private temporizador?: ReturnType<typeof setTimeout>;

    readonly mensaje = this._mensaje.asReadonly();
    readonly visible = this._visible.asReadonly();

    mostrar(mensaje: string, duracionMs = 2600): void {
        this._mensaje.set(mensaje);
        this._visible.set(true);

        clearTimeout(this.temporizador);
        this.temporizador = setTimeout(() => this._visible.set(false), duracionMs);
    }
}

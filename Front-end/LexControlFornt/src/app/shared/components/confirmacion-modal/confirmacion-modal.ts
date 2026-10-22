import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Modal } from '../modal/modal';

/* Modal de confirmación reutilizable para acciones destructivas
   (eliminaciones). Reemplaza al confirm() nativo del navegador con el
   estilo de la aplicación. Uso:
     <app-confirmacion-modal
         [abierto]="abierto()" titulo="..." mensaje="..."
         (confirmado)="ejecutar()" (cerrado)="cerrar()" /> */
@Component({
    selector: 'app-confirmacion-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Modal],
    template: `
        <app-modal [titulo]="titulo()" [abierto]="abierto()" (cerrado)="cerrado.emit()">
            <div class="confirmacion-cuerpo">
                <p class="confirmacion-mensaje">{{ mensaje() }}</p>
                <footer class="modal-footer">
                    <button type="button" class="btn-secondary" data-testid="btn-cancelar-eliminar"
                        (click)="cerrado.emit()">
                        Cancelar
                    </button>
                    <button type="button" class="btn-danger" data-testid="btn-confirmar-eliminar"
                        (click)="confirmado.emit()">
                        {{ etiquetaConfirmar() }}
                    </button>
                </footer>
            </div>
        </app-modal>
    `
})
export class ConfirmacionModal {
    readonly titulo = input('Confirmar eliminación');
    readonly mensaje = input.required<string>();
    readonly etiquetaConfirmar = input('Eliminar');
    readonly abierto = input.required<boolean>();
    readonly confirmado = output<void>();
    readonly cerrado = output<void>();
}

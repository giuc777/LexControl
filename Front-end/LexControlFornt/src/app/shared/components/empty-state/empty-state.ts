import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/* Mensaje centrado cuando no hay datos en una tabla o lista.
   Replica el .empty-state del prototipo (clientes.css:351-356). */
@Component({
    selector: 'app-empty-state',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="empty-state">{{ mensaje() }}</div>
    `
})
export class EmptyState {
    readonly mensaje = input('No se encontraron resultados.');
}

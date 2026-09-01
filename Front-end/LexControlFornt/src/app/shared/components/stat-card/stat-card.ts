import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/* Tarjeta de estadística para el bento grid del dashboard/clientes.
   Replica las .bento-card del prototipo (clientes.css:90-136). */
@Component({
    selector: 'app-stat-card',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <article class="bento-card">
            <h3 class="bento-label">{{ etiqueta() }}</h3>
            <div class="bento-value">{{ valor() }}</div>
            @if (badge()) {
                <span class="bento-badge" [class.warn]="advertencia()">{{ badge() }}</span>
            }
        </article>
    `
})
export class StatCard {
    readonly etiqueta = input.required<string>();
    readonly valor = input.required<number | string>();
    readonly badge = input<string>('');
    readonly advertencia = input(false);
}

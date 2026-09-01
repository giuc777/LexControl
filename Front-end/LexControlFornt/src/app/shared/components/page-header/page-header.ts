import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/* Encabezado de página con título, subtítulo y zona de acciones (botones).
   Replica la sección .page-header del prototipo (clientes.html:20-31). */
@Component({
    selector: 'app-page-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <header class="page-header">
            <div>
                <h1 class="page-title">{{ titulo() }}</h1>
                @if (subtitulo()) {
                    <p class="page-subtitle">{{ subtitulo() }}</p>
                }
            </div>
            <ng-content />
        </header>
    `
})
export class PageHeader {
    readonly titulo = input.required<string>();
    readonly subtitulo = input<string>('');
}

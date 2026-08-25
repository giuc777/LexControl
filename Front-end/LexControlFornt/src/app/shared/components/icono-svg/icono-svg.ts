import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/* Ícono SVG inline con los mismos paths del prototipo (layout.js).
   Uso: <svg appIcono [appIcono]="rutaDelPath" class="nav-icon"></svg> */
@Component({
    selector: 'svg[appIcono]',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.8',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
    },
    template: '<svg:path [attr.d]="appIcono()" />'
})
export class IconoSvg {
    readonly appIcono = input.required<string>();
}

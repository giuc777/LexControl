import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/* Badge pill coloreado para estados (ACTIVO, EN TRÁMITE, FINALIZADO).
   Replica los .pill y .badge del prototipo (clientes.css:309-365, 640-665). */
@Component({
    selector: 'app-badge-estado',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <span class="pill" [class]="claseCss()">{{ texto() }}</span>
    `
})
export class BadgeEstado {
    readonly texto = input.required<string>();
    readonly variante = input<'activo' | 'tramite' | 'finalizado' | 'total'>('activo');

    protected readonly claseCss = computed(() => {
        const mapa: Record<string, string> = {
            activo: 'pill-activo',
            tramite: 'pill-tramite',
            finalizado: 'pill-finalizado',
            total: 'pill-total'
        };
        return mapa[this.variante()] ?? 'pill-activo';
    });
}

import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, viewChild } from '@angular/core';

const X_PATH = 'M18 6L6 18M6 6l12 12';

let contador = 0;

/* Modal genérico reutilizable (mismas clases del prototipo en clientes.css):
   backdrop con click para cerrar, cierre con Escape y foco en la tarjeta
   al abrirse (agents.md §10.5). El cuerpo se proyecta con <form class="modal-form">. */
@Component({
    selector: 'app-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'modal-wrap',
        '[class.open]': 'abierto()',
        '(document:keydown.escape)': 'alEscape()'
    },
    template: `
        <div class="modal-backdrop" (click)="cerrado.emit()"></div>
        <div #tarjeta class="modal-card" role="dialog" aria-modal="true"
            [attr.aria-labelledby]="tituloId" [style.width]="ancho()" tabindex="-1">
            <header class="modal-header">
                <h2 class="modal-title" [id]="tituloId">{{ titulo() }}</h2>
                <button type="button" class="modal-close" aria-label="Cerrar" (click)="cerrado.emit()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path [attr.d]="xPath" />
                    </svg>
                </button>
            </header>
            <ng-content />
        </div>
    `
})
export class Modal {
    readonly titulo = input.required<string>();
    readonly ancho = input('min(560px,94vw)');
    readonly abierto = input.required<boolean>();
    readonly cerrado = output<void>();

    protected readonly xPath = X_PATH;
    protected readonly tituloId = `modal-titulo-${++contador}`;

    private readonly tarjeta = viewChild.required<ElementRef<HTMLElement>>('tarjeta');

    constructor() {
        /* Al abrir, lleva el foco a la tarjeta para navegación por teclado. */
        effect(() => {
            if (!this.abierto()) return;
            setTimeout(() => this.tarjeta().nativeElement.focus());
        });
    }

    alEscape(): void {
        if (!this.abierto()) return;
        this.cerrado.emit();
    }
}

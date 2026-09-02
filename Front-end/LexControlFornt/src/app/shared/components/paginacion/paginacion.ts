import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/* Controles de paginación server-side.
   Replica la .pagination del prototipo (clientes.css:360-401). */
@Component({
    selector: 'app-paginacion',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="pagination" data-testid="paginacion">
            <span class="pag-info">Mostrando {{ rangoTexto() }}</span>
            <div class="pag-buttons">
                @for (pagina of paginas(); track pagina) {
                    <button type="button"
                        class="pag-btn"
                        [class.active]="pagina === paginaActual()"
                        (click)="alPaginar(pagina)">
                        {{ pagina }}
                    </button>
                }
            </div>
        </div>
    `
})
export class Paginacion {
    readonly total = input.required<number>();
    readonly paginaActual = input.required<number>();
    readonly tamanioPagina = input.required<number>();

    readonly paginar = output<number>();

    protected readonly totalPaginas = computed(() =>
        Math.max(1, Math.ceil(this.total() / this.tamanioPagina()))
    );

    protected readonly paginas = computed(() => {
        const arr: number[] = [];
        for (let i = 1; i <= this.totalPaginas(); i++) arr.push(i);
        return arr;
    });

    protected readonly rangoTexto = computed(() => {
        const total = this.total();
        if (total === 0) return '0 de 0 clientes';
        const inicio = (this.paginaActual() - 1) * this.tamanioPagina() + 1;
        const fin = Math.min(this.paginaActual() * this.tamanioPagina(), total);
        return `${inicio}-${fin} de ${total} clientes`;
    });

    alPaginar(pagina: number): void {
        this.paginar.emit(pagina);
    }
}

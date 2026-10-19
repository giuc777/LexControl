import { Page, Locator } from '@playwright/test';

export class HistoricoPage {
    readonly tabla: Locator;
    readonly filas: Locator;
    readonly filtroBusqueda: Locator;
    readonly filtroRama: Locator;
    readonly btnBuscar: Locator;
    readonly btnLimpiar: Locator;

    constructor(private page: Page) {
        this.tabla = page.locator('table.tabla-datos');
        this.filas = page.locator('table.tabla-datos tbody tr.fila-clickeable');
        this.filtroBusqueda = page.locator('.historico-toolbar input.filtro-input').first();
        this.filtroRama = page.locator('.historico-toolbar select.filtro-select').first();
        this.btnBuscar = page.locator('.filtro-acciones .btn-primary', { hasText: 'Buscar' });
        this.btnLimpiar = page.locator('.filtro-acciones .btn-secondary', { hasText: 'Limpiar' });
    }

    async navigate(): Promise<void> {
        await this.page.goto('/historico');
    }

    async getRowCount(): Promise<number> {
        return this.filas.count();
    }

    async clickExpediente(fila: number): Promise<void> {
        await this.filas.nth(fila).click();
    }

    async buscar(texto: string): Promise<void> {
        await this.filtroBusqueda.fill(texto);
        await this.btnBuscar.click();
    }
}

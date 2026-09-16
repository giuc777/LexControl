import { Page, Locator } from '@playwright/test';

export class HistoricoPage {
    readonly tabla: Locator;
    readonly filas: Locator;
    readonly filtroBusqueda: Locator;
    readonly filtroRama: Locator;
    readonly btnBuscar: Locator;
    readonly btnLimpiar: Locator;

    constructor(private page: Page) {
        this.tabla = page.locator('[data-testid="historico-table"]');
        this.filas = page.locator('[data-testid="historico-table"] tbody tr');
        this.filtroBusqueda = page.locator('[data-testid="filtro-busqueda"]');
        this.filtroRama = page.locator('[data-testid="filtro-rama"]');
        this.btnBuscar = page.locator('[data-testid="btn-buscar"]');
        this.btnLimpiar = page.locator('[data-testid="btn-limpiar"]');
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

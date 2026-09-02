import { Page, Locator } from '@playwright/test';

export class ClientesPage {
    readonly bentoGrid: Locator;
    readonly tabla: Locator;
    readonly filtroEstado: Locator;
    readonly btnNuevoCliente: Locator;
    readonly paginacion: Locator;
    readonly filas: Locator;

    constructor(private page: Page) {
        this.bentoGrid = page.locator('[data-testid="bento-grid"]');
        this.tabla = page.locator('[data-testid="clientes-table"]');
        this.filtroEstado = page.locator('[data-testid="filtro-estado"]');
        this.btnNuevoCliente = page.locator('[data-testid="btn-nuevo-cliente"]');
        this.paginacion = page.locator('[data-testid="paginacion"]');
        this.filas = page.locator('[data-testid="clientes-table"] tbody tr');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/clientes');
    }

    async getStatCardValues(): Promise<string[]> {
        const cards = this.page.locator('.bento-card .bento-value');
        return cards.allTextContents();
    }

    async filterByEstado(estado: string): Promise<void> {
        await this.filtroEstado.selectOption(estado);
    }

    async clickCliente(fila: number): Promise<void> {
        await this.filas.nth(fila).click();
    }

    async getRowCount(): Promise<number> {
        return this.filas.count();
    }

    async openNewClientModal(): Promise<void> {
        await this.btnNuevoCliente.click();
    }

    async getPaginationText(): Promise<string> {
        return (await this.page.locator('.pag-info').textContent()) ?? '';
    }
}

import { Page, Locator } from '@playwright/test';

export class ExpedientesPage {
    readonly tabla: Locator;
    readonly filas: Locator;
    readonly btnNuevoExpediente: Locator;
    readonly filtroEstado: Locator;
    readonly filtroRama: Locator;
    readonly filtroBusqueda: Locator;
    readonly paginacion: Locator;

    constructor(private page: Page) {
        this.tabla = page.locator('[data-testid="expedientes-table"]');
        this.filas = page.locator('[data-testid="expedientes-table"] tbody tr');
        this.btnNuevoExpediente = page.locator('[data-testid="btn-nuevo-expediente"]');
        this.filtroEstado = page.locator('[data-testid="filtro-estado"]');
        this.filtroRama = page.locator('[data-testid="filtro-rama"]');
        this.filtroBusqueda = page.locator('[data-testid="filtro-busqueda"]');
        this.paginacion = page.locator('[data-testid="paginacion"]');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/expedientes');
    }

    async getRowCount(): Promise<number> {
        return this.filas.count();
    }

    async clickExpediente(fila: number): Promise<void> {
        await this.filas.nth(fila).click();
    }

    async openNewExpedienteModal(): Promise<void> {
        await this.btnNuevoExpediente.click();
    }
}

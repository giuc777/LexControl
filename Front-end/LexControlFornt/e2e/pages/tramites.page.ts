import { Page, Locator } from '@playwright/test';

export class TramitesPage {
    readonly tabla: Locator;
    readonly filas: Locator;
    readonly btnNuevoTramite: Locator;
    readonly filtroEstado: Locator;
    readonly filtroTipo: Locator;

    constructor(private page: Page) {
        this.tabla = page.locator('[data-testid="tramites-table"]');
        this.filas = page.locator('[data-testid="tramites-table"] tbody tr');
        this.btnNuevoTramite = page.locator('[data-testid="btn-nuevo-tramite"]');
        this.filtroEstado = page.locator('[data-testid="filtro-estado"]');
        this.filtroTipo = page.locator('[data-testid="filtro-tipo"]');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/tramites');
    }

    async getRowCount(): Promise<number> {
        return this.filas.count();
    }

    async clickTramite(fila: number): Promise<void> {
        await this.filas.nth(fila).click();
    }

    async openNewTramiteModal(): Promise<void> {
        await this.btnNuevoTramite.click();
    }
}

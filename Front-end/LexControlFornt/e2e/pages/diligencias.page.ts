import { Page, Locator } from '@playwright/test';

export class DiligenciasPage {
    readonly tabla: Locator;
    readonly filas: Locator;
    readonly btnNuevaDiligencia: Locator;
    readonly filtroEstado: Locator;
    readonly filtroTipo: Locator;

    constructor(private page: Page) {
        this.tabla = page.locator('[data-testid="diligencias-table"]');
        this.filas = page.locator('[data-testid="diligencias-table"] tbody tr');
        this.btnNuevaDiligencia = page.locator('[data-testid="btn-nueva-diligencia"]');
        this.filtroEstado = page.locator('[data-testid="filtro-estado"]');
        this.filtroTipo = page.locator('[data-testid="filtro-tipo"]');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/diligencias');
    }

    async getRowCount(): Promise<number> {
        return this.filas.count();
    }

    async clickDiligencia(fila: number): Promise<void> {
        await this.filas.nth(fila).click();
    }

    async openNewDiligenciaModal(): Promise<void> {
        await this.btnNuevaDiligencia.click();
    }
}

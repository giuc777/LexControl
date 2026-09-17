import { Page, Locator } from '@playwright/test';

export class ReportesPage {
    readonly categorias: Locator;
    readonly btnVolver: Locator;
    readonly exportBtn: Locator;

    constructor(private page: Page) {
        this.categorias = page.locator('[data-testid="reportes-categorias"] .rep-cat-panel');
        this.btnVolver = page.locator('[data-testid="btn-volver-reportes"]');
        this.exportBtn = page.locator('.rep-export-btn').first();
    }

    async navigate(): Promise<void> {
        await this.page.goto('/reportes');
    }

    async abrirCategoria(key: string): Promise<void> {
        await this.page.locator(`[data-testid="reporte-${key}"]`).click();
    }

    reporteVisible(key: string): Locator {
        return this.page.locator(`[data-testid="reporte-${key}"]`);
    }

    async isLoaded(): Promise<boolean> {
        return this.page.url().includes('/reportes');
    }
}
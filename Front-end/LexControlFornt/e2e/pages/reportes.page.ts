import { Page, Locator } from '@playwright/test';

export class ReportesPage {
    readonly categorias: Locator;

    constructor(private page: Page) {
        this.categorias = page.locator('[data-testid="reporte-categoria"]');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/reportes');
    }

    async isLoaded(): Promise<boolean> {
        return this.page.url().includes('/reportes');
    }
}

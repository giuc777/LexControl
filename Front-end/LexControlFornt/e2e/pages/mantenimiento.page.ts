import { Page, Locator } from '@playwright/test';

export class MantenimientoPage {
    readonly listaCatalogos: Locator;
    readonly btnNuevoItem: Locator;

    constructor(private page: Page) {
        this.listaCatalogos = page.locator('[data-testid="lista-catalogos"]');
        this.btnNuevoItem = page.locator('[data-testid="btn-nuevo-item"]');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/mantenimiento');
    }

    async clickCatalogo(nombre: string): Promise<void> {
        await this.page.locator(`[data-testid="catalogo-${nombre}"]`).click();
    }
}

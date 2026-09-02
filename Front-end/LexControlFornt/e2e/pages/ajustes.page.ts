import { Page, Locator } from '@playwright/test';

export class AjustesPage {
    readonly perfilCard: Locator;
    readonly usuariosCard: Locator;
    readonly permisosCard: Locator;
    readonly btnEditarPerfil: Locator;
    readonly tablaUsuarios: Locator;
    readonly tablaPermisos: Locator;

    constructor(private page: Page) {
        this.perfilCard = page.locator('[data-testid="perfil-card"]');
        this.usuariosCard = page.locator('[data-testid="usuarios-card"]');
        this.permisosCard = page.locator('[data-testid="permisos-card"]');
        this.btnEditarPerfil = page.locator('[data-testid="btn-editar-perfil"]');
        this.tablaUsuarios = page.locator('[data-testid="usuarios-table"]');
        this.tablaPermisos = page.locator('[data-testid="permisos-table"]');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/ajustes');
    }

    async isLoaded(): Promise<boolean> {
        return this.page.url().includes('/ajustes');
    }
}

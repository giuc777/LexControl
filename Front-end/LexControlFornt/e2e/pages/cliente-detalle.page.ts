import { Page, Locator } from '@playwright/test';

export class ClienteDetallePage {
    readonly breadcrumb: Locator;
    readonly nombre: Locator;
    readonly badgeEstado: Locator;
    readonly badgeTipo: Locator;
    readonly infoDatos: Locator;
    readonly btnEditar: Locator;
    readonly tablaExpedientes: Locator;
    readonly filasExpedientes: Locator;

    constructor(private page: Page) {
        this.breadcrumb = page.locator('.breadcrumb');
        this.nombre = page.locator('.info-nombre');
        this.badgeEstado = page.locator('.badge-activo, .badge.inactivo');
        this.badgeTipo = page.locator('.badge-tipo');
        this.infoDatos = page.locator('.info-dl');
        this.btnEditar = page.locator('[data-testid="btn-editar-cliente"]');
        this.tablaExpedientes = page.locator('[data-testid="expedientes-table"]');
        this.filasExpedientes = page.locator('[data-testid="expedientes-table"] tbody tr');
    }

    async navigate(id: number): Promise<void> {
        await this.page.goto(`/clientes/${id}`);
    }

    async getNombre(): Promise<string> {
        return (await this.nombre.textContent()) ?? '';
    }

    async getExpedienteCount(): Promise<number> {
        return this.filasExpedientes.count();
    }

    async clickEditar(): Promise<void> {
        await this.btnEditar.click();
    }
}

import { Page, Locator } from '@playwright/test';

export class NotificacionesPage {
    readonly tabla: Locator;
    readonly filas: Locator;
    readonly btnNuevaNotificacion: Locator;
    readonly filtroEstado: Locator;
    readonly filtroTipo: Locator;

    constructor(private page: Page) {
        this.tabla = page.locator('[data-testid="notificaciones-table"]');
        this.filas = page.locator('[data-testid="notificaciones-table"] tbody tr');
        this.btnNuevaNotificacion = page.locator('[data-testid="btn-nueva-notificacion"]');
        this.filtroEstado = page.locator('[data-testid="filtro-estado"]');
        this.filtroTipo = page.locator('[data-testid="filtro-tipo"]');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/notificaciones-oj');
    }

    async getRowCount(): Promise<number> {
        return this.filas.count();
    }

    async clickNotificacion(fila: number): Promise<void> {
        await this.filas.nth(fila).click();
    }

    async openNewNotificacionModal(): Promise<void> {
        await this.btnNuevaNotificacion.click();
    }
}

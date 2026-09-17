import { Page, Locator } from '@playwright/test';

export class NotificacionesPage {
    readonly tabla: Locator;
    readonly filas: Locator;
    readonly btnNuevaNotificacion: Locator;
    readonly filtroEstado: Locator;
    readonly filtroTipo: Locator;
    readonly badgeOj: Locator;
    readonly modal: Locator;
    readonly selectExpediente: Locator;
    readonly selectTipo: Locator;
    readonly inputFecha: Locator;
    readonly btnVerificarDuplicado: Locator;
    readonly btnGuardar: Locator;

    constructor(private page: Page) {
        this.tabla = page.locator('[data-testid="notificaciones-tabla"]');
        this.filas = page.locator('[data-testid="notificaciones-tabla"] tbody tr');
        this.btnNuevaNotificacion = page.locator('[data-testid="btn-nueva-notificacion"]');
        this.filtroEstado = page.locator('[data-testid="filtro-estado"]');
        this.filtroTipo = page.locator('[data-testid="filtro-tipo"]');
        this.badgeOj = page.locator('[data-testid="badge-oj"]');
        this.modal = page.locator('app-notificacion-modal');
        this.selectExpediente = page.locator('[data-testid="select-expediente"]');
        this.selectTipo = page.locator('[data-testid="select-tipo"]');
        this.inputFecha = page.locator('[data-testid="input-fecha"]');
        this.btnVerificarDuplicado = page.locator('[data-testid="btn-verificar-duplicado"]');
        this.btnGuardar = page.locator('[data-testid="btn-guardar-notificacion"]');
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
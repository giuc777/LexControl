import { Page, Locator } from '@playwright/test';

export class AgendaPage {
    readonly calendario: Locator;
    readonly btnNuevaAudiencia: Locator;
    readonly btnNuevaDiligencia: Locator;
    readonly diasCalendario: Locator;
    readonly eventosDia: Locator;

    constructor(private page: Page) {
        this.calendario = page.locator('[data-testid="calendario-agenda"]');
        this.btnNuevaAudiencia = page.locator('[data-testid="btn-nueva-audiencia"]');
        this.btnNuevaDiligencia = page.locator('[data-testid="btn-nueva-diligencia"]');
        this.diasCalendario = page.locator('[data-testid="dia-calendario"]');
        this.eventosDia = page.locator('[data-testid="evento-dia"]');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/agenda');
    }

    async clickDia(indice: number): Promise<void> {
        await this.diasCalendario.nth(indice).click();
    }
}

import { Page, Locator } from '@playwright/test';

export class DashboardPage {
    readonly statCards: Locator;
    readonly sidebar: Locator;

    constructor(private page: Page) {
        this.statCards = page.locator('.stat-card');
        this.sidebar = page.locator('[data-testid="sidebar"]');
    }

    async isLoaded(): Promise<boolean> {
        return this.page.url().includes('/dashboard');
    }

    async getSidebarLinks(): Locator {
        return this.sidebar.locator('.nav-item');
    }

    async navigateTo(modulo: string): Promise<void> {
        await this.sidebar.locator(`text=${modulo}`).first().click();
    }
}

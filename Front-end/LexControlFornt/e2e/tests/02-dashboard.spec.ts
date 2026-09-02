import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Módulo Dashboard', () => {
    test('TC-DASH-001: Carga del dashboard con stat cards', async ({ adminPage }) => {
        const dash = new DashboardPage(adminPage);
        await expect(dash.statCards.first()).toBeVisible({ timeout: 15000 });
        const count = await dash.statCards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('TC-DASH-002: Sidebar visible con navegación', async ({ adminPage }) => {
        const dash = new DashboardPage(adminPage);
        await expect(dash.sidebar).toBeVisible();
        const links = await dash.getSidebarLinks();
        const count = await links.count();
        expect(count).toBeGreaterThan(0);
    });

    test('TC-DASH-003: Agenda semanal visible', async ({ adminPage }) => {
        const agenda = adminPage.locator('[data-testid="agenda-semanal"]');
        await expect(agenda).toBeVisible({ timeout: 15000 });
    });

    test('TC-DASH-004: Navegación a módulo desde sidebar', async ({ adminPage }) => {
        const dash = new DashboardPage(adminPage);
        await dash.navigateTo('Clientes');
        await adminPage.waitForURL('**/clientes', { timeout: 10000 });
        expect(adminPage.url()).toContain('/clientes');
    });
});

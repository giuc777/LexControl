import { test, expect } from '../fixtures/auth.fixture';
import { ReportesPage } from '../pages/reportes.page';

test.describe('Módulo Reportes', () => {
    test('TC-REP-001: Página de reportes carga correctamente', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await expect(adminPage.locator('.page-title')).toContainText('Reportes', { timeout: 15000 });
    });

    test('TC-REP-002: Categorías de reporte visibles', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await expect(adminPage.locator('[data-testid="reportes-categorias"]')).toBeVisible({ timeout: 15000 });
    });

    test('TC-REP-003: Sidebar funciona en reportes', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await expect(adminPage.locator('[data-testid="sidebar"]')).toBeVisible();
    });
});

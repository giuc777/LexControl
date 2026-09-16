import { test, expect } from '../fixtures/auth.fixture';
import { MantenimientoPage } from '../pages/mantenimiento.page';

test.describe('Módulo Mantenimiento', () => {
    test('TC-MAN-001: Página de mantenimiento carga correctamente', async ({ adminPage }) => {
        const mantenimiento = new MantenimientoPage(adminPage);
        await mantenimiento.navigate();
        await expect(adminPage.locator('.page-title')).toContainText('Mantenimiento', { timeout: 15000 });
    });

    test('TC-MAN-002: Lista de catálogos visible', async ({ adminPage }) => {
        const mantenimiento = new MantenimientoPage(adminPage);
        await mantenimiento.navigate();
        await expect(mantenimiento.listaCatalogos).toBeVisible({ timeout: 15000 });
    });

    test('TC-MAN-003: Sidebar muestra módulo Mantenimiento', async ({ adminPage }) => {
        const sidebar = adminPage.locator('[data-testid="sidebar"]');
        await expect(sidebar).toBeVisible();
        const text = await sidebar.textContent();
        expect(text).toContain('Mantenimiento');
    });
});

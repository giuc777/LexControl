import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Permisos y Navegación', () => {
    test('TC-PERM-001: Admin puede acceder a todos los módulos', async ({ adminPage }) => {
        const dash = new DashboardPage(adminPage);
        const links = await dash.getSidebarLinks();
        const count = await links.count();
        expect(count).toBeGreaterThanOrEqual(5);
    });

    test('TC-PERM-002: Sidebar muestra módulos correctos para admin', async ({ adminPage }) => {
        const sidebar = adminPage.locator('[data-testid="sidebar"]');
        await expect(sidebar).toBeVisible();
        const text = await sidebar.textContent();
        expect(text).toContain('Dashboard');
        expect(text).toContain('Clientes');
    });

    test('TC-PERM-003: Navegación entre módulos funciona', async ({ adminPage }) => {
        const sidebar = adminPage.locator('[data-testid="sidebar"]');
        await sidebar.locator('.nav-item a', { hasText: 'Clientes' }).click();
        await adminPage.waitForURL('**/clientes', { timeout: 10000 });
        expect(adminPage.url()).toContain('/clientes');

        await sidebar.locator('.nav-item a', { hasText: 'Dashboard' }).click();
        await adminPage.waitForURL('**/dashboard', { timeout: 10000 });
        expect(adminPage.url()).toContain('/dashboard');
    });

    test('TC-PERM-004: Ruta no válida redirige a dashboard', async ({ adminPage }) => {
        await adminPage.goto('/ruta-inexistente-12345');
        await adminPage.waitForTimeout(2000);
        expect(adminPage.url()).toContain('/dashboard');
    });
});

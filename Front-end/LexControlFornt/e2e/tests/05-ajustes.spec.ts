import { test, expect } from '../fixtures/auth.fixture';
import { AjustesPage } from '../pages/ajustes.page';

test.describe('Módulo Ajustes', () => {
    test('TC-ADJ-001: Página de ajustes carga correctamente', async ({ adminPage }) => {
        const ajustes = new AjustesPage(adminPage);
        await ajustes.navigate();
        await expect(adminPage.locator('.page-title')).toContainText('Ajustes', { timeout: 15000 });
    });

    test('TC-ADJ-002: Tarjeta de perfil visible', async ({ adminPage }) => {
        const ajustes = new AjustesPage(adminPage);
        await ajustes.navigate();
        await expect(adminPage.locator('.aj-grid')).toBeVisible({ timeout: 15000 });
    });

    test('TC-ADJ-003: Módulos de administrador visibles', async ({ adminPage }) => {
        const ajustes = new AjustesPage(adminPage);
        await ajustes.navigate();
        await expect(adminPage.locator('.aj-stack')).toBeVisible({ timeout: 15000 });
    });

    test('TC-ADJ-004: Tarjeta de seguridad visible', async ({ adminPage }) => {
        const ajustes = new AjustesPage(adminPage);
        await ajustes.navigate();
        await expect(adminPage.locator('app-seguridad-card')).toBeVisible({ timeout: 15000 });
    });

    test('TC-ADJ-005: Sidebar funciona en ajustes', async ({ adminPage }) => {
        const ajustes = new AjustesPage(adminPage);
        await ajustes.navigate();
        await expect(adminPage.locator('[data-testid="sidebar"]')).toBeVisible();
    });

    test('TC-ADJ-006: Navegar de ajustes a dashboard', async ({ adminPage }) => {
        const ajustes = new AjustesPage(adminPage);
        await ajustes.navigate();
        await adminPage.locator('[data-testid="sidebar"] .nav-item a', { hasText: 'Dashboard' }).click();
        await adminPage.waitForURL('**/dashboard', { timeout: 10000 });
        expect(adminPage.url()).toContain('/dashboard');
    });
});

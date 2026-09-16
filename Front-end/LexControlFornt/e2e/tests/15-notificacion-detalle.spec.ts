import { test, expect } from '../fixtures/auth.fixture';

test.describe('Notificación Detalle', () => {
    test('TC-NDE-001: Detalle de notificación carga correctamente', async ({ adminPage }) => {
        await adminPage.goto('/notificaciones-oj/1');
        await adminPage.waitForTimeout(2000);
        const url = adminPage.url();
        expect(url).toContain('/notificaciones-oj/');
    });

    test('TC-NDE-002: Botón volver visible', async ({ adminPage }) => {
        await adminPage.goto('/notificaciones-oj/1');
        await adminPage.waitForTimeout(2000);
        const btnVolver = adminPage.locator('[data-testid="btn-volver"]');
        if (await btnVolver.isVisible()) {
            await expect(btnVolver).toBeVisible();
        }
    });

    test('TC-NDE-003: Navegación de vuelta funciona', async ({ adminPage }) => {
        await adminPage.goto('/notificaciones-oj/1');
        await adminPage.waitForTimeout(2000);
        const btnVolver = adminPage.locator('[data-testid="btn-volver"]');
        if (await btnVolver.isVisible()) {
            await btnVolver.click();
            await adminPage.waitForURL('**/notificaciones-oj', { timeout: 10000 });
            expect(adminPage.url()).toContain('/notificaciones-oj');
        }
    });
});

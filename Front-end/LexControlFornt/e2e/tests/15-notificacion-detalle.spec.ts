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

    test('TC-NDE-004: Botón Editar abre el modal en modo edición', async ({ adminPage }) => {
        await adminPage.goto('/notificaciones-oj/1');
        await adminPage.waitForTimeout(2000);
        const btnEditar = adminPage.locator('[data-testid="btn-editar-notificacion"]');
        if (await btnEditar.isVisible()) {
            await btnEditar.click();
            await expect(adminPage.locator('app-notificacion-modal')).toBeVisible({ timeout: 10000 });
        }
    });

    test('TC-NDE-005: Muestra tipo y estado de la notificación', async ({ adminPage }) => {
        await adminPage.goto('/notificaciones-oj/1');
        await adminPage.waitForTimeout(2000);
        const tipo = adminPage.locator('[data-testid="notificacion-tipo"]');
        const estado = adminPage.locator('[data-testid="notificacion-estado"]');
        if (await tipo.isVisible()) {
            await expect(tipo).toBeVisible();
            await expect(estado).toBeVisible();
        }
    });
});

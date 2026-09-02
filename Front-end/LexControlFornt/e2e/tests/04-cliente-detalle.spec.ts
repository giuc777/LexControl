import { test, expect } from '../fixtures/auth.fixture';
import { ClienteDetallePage } from '../pages/cliente-detalle.page';

test.describe('Módulo Cliente Detalle', () => {
    test('TC-DET-001: Detalle de cliente carga correctamente', async ({ adminPage }) => {
        const detalle = new ClienteDetallePage(adminPage);
        await detalle.navigate(1);
        await adminPage.waitForTimeout(2000);
        const url = adminPage.url();
        expect(url).toContain('/clientes/1');
    });

    test('TC-DET-002: Información del cliente visible', async ({ adminPage }) => {
        const detalle = new ClienteDetallePage(adminPage);
        await detalle.navigate(1);
        await adminPage.waitForTimeout(2000);
        await expect(detalle.infoDatos).toBeVisible({ timeout: 10000 });
    });

    test('TC-DET-003: Breadcrumb de navegación', async ({ adminPage }) => {
        const detalle = new ClienteDetallePage(adminPage);
        await detalle.navigate(1);
        await adminPage.waitForTimeout(2000);
        await expect(detalle.breadcrumb).toBeVisible({ timeout: 10000 });
    });

    test('TC-DET-004: Botón editar visible', async ({ adminPage }) => {
        const detalle = new ClienteDetallePage(adminPage);
        await detalle.navigate(1);
        await adminPage.waitForTimeout(2000);
        await expect(detalle.btnEditar).toBeVisible({ timeout: 10000 });
    });

    test('TC-DET-005: Tabla de expedientes del cliente', async ({ adminPage }) => {
        const detalle = new ClienteDetallePage(adminPage);
        await detalle.navigate(1);
        await adminPage.waitForTimeout(2000);
        const tablaExp = adminPage.locator('.data-table-exp');
        await expect(tablaExp).toBeVisible({ timeout: 10000 });
    });
});

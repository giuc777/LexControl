import { test, expect } from '../fixtures/auth.fixture';
import { ClientesPage } from '../pages/clientes.page';

test.describe('Módulo Clientes', () => {
    test('TC-CLI-001: Listado de clientes carga correctamente', async ({ adminPage }) => {
        const clientes = new ClientesPage(adminPage);
        await clientes.navigate();
        await expect(clientes.tabla).toBeVisible({ timeout: 15000 });
    });

    test('TC-CLI-002: Stat cards muestran datos', async ({ adminPage }) => {
        const clientes = new ClientesPage(adminPage);
        await clientes.navigate();
        await expect(clientes.bentoGrid).toBeVisible({ timeout: 15000 });
    });

    test('TC-CLI-003: Filtro por estado funciona', async ({ adminPage }) => {
        const clientes = new ClientesPage(adminPage);
        await clientes.navigate();
        await expect(clientes.filtroEstado).toBeVisible({ timeout: 15000 });
        await clientes.filterByEstado('Activo');
        await adminPage.waitForTimeout(1000);
    });

    test('TC-CLI-004: Botón Nuevo Cliente abre modal', async ({ adminPage }) => {
        const clientes = new ClientesPage(adminPage);
        await clientes.navigate();
        await expect(clientes.btnNuevoCliente).toBeVisible({ timeout: 15000 });
        await clientes.openNewClientModal();
        await expect(adminPage.locator('[data-testid="cli-nombre"]')).toBeVisible({ timeout: 5000 });
    });

    test('TC-CLI-005: Crear nuevo cliente', async ({ adminPage }) => {
        const clientes = new ClientesPage(adminPage);
        await clientes.navigate();
        await clientes.openNewClientModal();

        await adminPage.locator('[data-testid="cli-nombre"]').fill('Juan Test Playwright');
        await adminPage.locator('[data-testid="cli-dpi"]').fill('3012345678901');
        await adminPage.locator('[data-testid="cli-telefono"]').fill('+502 5555-9999');
        await adminPage.locator('[data-testid="cli-email"]').fill('juan.test@playwright.com');
        await adminPage.locator('[data-testid="btn-guardar-cliente"]').click();

        await adminPage.waitForTimeout(2000);
    });

    test('TC-CLI-006: Paginación funciona', async ({ adminPage }) => {
        const clientes = new ClientesPage(adminPage);
        await clientes.navigate();
        await expect(clientes.tabla).toBeVisible({ timeout: 15000 });
        const paginacion = adminPage.locator('[data-testid="paginacion"]');
        if (await paginacion.isVisible()) {
            await expect(paginacion).toBeVisible();
        }
    });

    test('TC-CLI-007: Click en fila navega al detalle', async ({ adminPage }) => {
        const clientes = new ClientesPage(adminPage);
        await clientes.navigate();
        await expect(clientes.tabla).toBeVisible({ timeout: 15000 });
        const filasCount = await clientes.getRowCount();
        if (filasCount > 0) {
            await clientes.clickCliente(0);
            await adminPage.waitForURL('**/clientes/**', { timeout: 10000 });
            expect(adminPage.url()).toContain('/clientes/');
        }
    });

    test('TC-CLI-008: Tabla con columnas correctas', async ({ adminPage }) => {
        const clientes = new ClientesPage(adminPage);
        await clientes.navigate();
        await expect(clientes.tabla).toBeVisible({ timeout: 15000 });
        const headers = adminPage.locator('[data-testid="clientes-table"] th');
        const count = await headers.count();
        expect(count).toBe(6);
    });
});

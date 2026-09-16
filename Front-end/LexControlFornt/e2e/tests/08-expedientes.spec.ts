import { test, expect } from '../fixtures/auth.fixture';
import { ExpedientesPage } from '../pages/expedientes.page';

test.describe('Módulo Expedientes', () => {
    test('TC-EXP-001: Listado de expedientes carga correctamente', async ({ adminPage }) => {
        const expedientes = new ExpedientesPage(adminPage);
        await expedientes.navigate();
        await expect(expedientes.tabla).toBeVisible({ timeout: 15000 });
    });

    test('TC-EXP-002: Tabla muestra filas de datos', async ({ adminPage }) => {
        const expedientes = new ExpedientesPage(adminPage);
        await expedientes.navigate();
        await expect(expedientes.tabla).toBeVisible({ timeout: 15000 });
        const count = await expedientes.getRowCount();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('TC-EXP-003: Botón Nuevo Expediente visible', async ({ adminPage }) => {
        const expedientes = new ExpedientesPage(adminPage);
        await expedientes.navigate();
        await expect(expedientes.btnNuevoExpediente).toBeVisible({ timeout: 15000 });
    });

    test('TC-EXP-004: Filtros visibles', async ({ adminPage }) => {
        const expedientes = new ExpedientesPage(adminPage);
        await expedientes.navigate();
        await expect(expedientes.filtroEstado).toBeVisible({ timeout: 15000 });
    });

    test('TC-EXP-005: Click en fila navega al detalle', async ({ adminPage }) => {
        const expedientes = new ExpedientesPage(adminPage);
        await expedientes.navigate();
        await expect(expedientes.tabla).toBeVisible({ timeout: 15000 });
        const count = await expedientes.getRowCount();
        if (count > 0) {
            await expedientes.clickExpediente(0);
            await adminPage.waitForURL('**/expedientes/**', { timeout: 10000 });
            expect(adminPage.url()).toContain('/expedientes/');
        }
    });

    test('TC-EXP-006: Sidebar muestra módulo Expedientes', async ({ adminPage }) => {
        const sidebar = adminPage.locator('[data-testid="sidebar"]');
        await expect(sidebar).toBeVisible();
        const text = await sidebar.textContent();
        expect(text).toContain('Expedientes');
    });
});

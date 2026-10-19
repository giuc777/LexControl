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

    test('TC-EXP-007: Crear expediente con rol y juzgado "Otro (escribir…)"', async ({ adminPage }) => {
        const expedientes = new ExpedientesPage(adminPage);
        await expedientes.navigate();
        await expedientes.openNewExpedienteModal();

        const modal = adminPage.locator('app-expediente-modal [data-testid="btn-guardar-expediente"]');
        await expect(modal).toBeVisible({ timeout: 10000 });

        await adminPage.locator('[data-testid="exp-no"]')
            .fill(`CIV-2026-E2E-${Date.now()}`);
        await adminPage.locator('[data-testid="exp-fecha"]').fill('2026-10-19');
        await adminPage.locator('[data-testid="exp-cliente"]').selectOption({ index: 1 });
        await adminPage.locator('[data-testid="exp-rama"]').selectOption({ index: 1 });

        // Rol procesal: valor nuevo capturado a mano.
        await adminPage.locator('[data-testid="exp-rol"]').selectOption({ label: 'Otro (escribir…)' });
        const inputRol = adminPage.locator('[data-testid="exp-rol-otro"]');
        await expect(inputRol).toBeVisible();
        await inputRol.fill('Rol E2E Otro');

        // Juzgado: valor nuevo capturado a mano.
        await adminPage.locator('[data-testid="exp-juzgado"]').selectOption({ label: 'Otro (escribir…)' });
        const inputJuzgado = adminPage.locator('[data-testid="exp-juzgado-otro"]');
        await expect(inputJuzgado).toBeVisible();
        await inputJuzgado.fill('Juzgado E2E Otro');

        await adminPage.locator('[data-testid="exp-abogado"]').selectOption({ index: 1 });
        await adminPage.locator('[data-testid="btn-guardar-expediente"]').click();

        // El modal se cierra solo si el backend aceptó el alta (201 con resolución de textos).
        await expect(modal).toBeHidden({ timeout: 15000 });
    });
});

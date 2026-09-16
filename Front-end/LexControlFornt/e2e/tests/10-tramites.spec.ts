import { test, expect } from '../fixtures/auth.fixture';
import { TramitesPage } from '../pages/tramites.page';

test.describe('Módulo Trámites', () => {
    test('TC-TRA-001: Listado de trámites carga correctamente', async ({ adminPage }) => {
        const tramites = new TramitesPage(adminPage);
        await tramites.navigate();
        await expect(tramites.tabla).toBeVisible({ timeout: 15000 });
    });

    test('TC-TRA-002: Botón Nuevo Trámite visible', async ({ adminPage }) => {
        const tramites = new TramitesPage(adminPage);
        await tramites.navigate();
        await expect(tramites.btnNuevoTramite).toBeVisible({ timeout: 15000 });
    });

    test('TC-TRA-003: Filtros visibles', async ({ adminPage }) => {
        const tramites = new TramitesPage(adminPage);
        await tramites.navigate();
        await expect(tramites.filtroEstado).toBeVisible({ timeout: 15000 });
        await expect(tramites.filtroTipo).toBeVisible({ timeout: 15000 });
    });

    test('TC-TRA-004: Click en fila navega al detalle', async ({ adminPage }) => {
        const tramites = new TramitesPage(adminPage);
        await tramites.navigate();
        await expect(tramites.tabla).toBeVisible({ timeout: 15000 });
        const count = await tramites.getRowCount();
        if (count > 0) {
            await tramites.clickTramite(0);
            await adminPage.waitForURL('**/tramites/**', { timeout: 10000 });
            expect(adminPage.url()).toContain('/tramites/');
        }
    });

    test('TC-TRA-005: Sidebar muestra módulo Trámites', async ({ adminPage }) => {
        const sidebar = adminPage.locator('[data-testid="sidebar"]');
        await expect(sidebar).toBeVisible();
        const text = await sidebar.textContent();
        expect(text).toContain('Trámites');
    });
});

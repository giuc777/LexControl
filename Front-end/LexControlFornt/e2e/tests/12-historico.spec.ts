import { test, expect } from '../fixtures/auth.fixture';
import { HistoricoPage } from '../pages/historico.page';

test.describe('Módulo Histórico Legal', () => {
    test('TC-HIS-001: Página de histórico carga correctamente', async ({ adminPage }) => {
        const historico = new HistoricoPage(adminPage);
        await historico.navigate();
        await expect(adminPage.locator('.page-title')).toContainText('Histórico', { timeout: 15000 });
    });

    test('TC-HIS-002: Filtros visibles', async ({ adminPage }) => {
        const historico = new HistoricoPage(adminPage);
        await historico.navigate();
        await expect(historico.filtroBusqueda).toBeVisible({ timeout: 15000 });
        await expect(historico.filtroRama).toBeVisible({ timeout: 15000 });
    });

    test('TC-HIS-003: Botones de buscar y limpiar visibles', async ({ adminPage }) => {
        const historico = new HistoricoPage(adminPage);
        await historico.navigate();
        await expect(historico.btnBuscar).toBeVisible({ timeout: 15000 });
        await expect(historico.btnLimpiar).toBeVisible({ timeout: 15000 });
    });

    test('TC-HIS-004: Tabla visible o empty state', async ({ adminPage }) => {
        const historico = new HistoricoPage(adminPage);
        await historico.navigate();
        const tabla = adminPage.locator('[data-testid="historico-table"]');
        const empty = adminPage.locator('.empty-state');
        await expect(tabla.or(empty)).toBeVisible({ timeout: 15000 });
    });

    test('TC-HIS-005: Sidebar muestra módulo Histórico', async ({ adminPage }) => {
        const sidebar = adminPage.locator('[data-testid="sidebar"]');
        await expect(sidebar).toBeVisible();
        const text = await sidebar.textContent();
        expect(text).toContain('Histórico');
    });
});

import { test, expect } from '../fixtures/auth.fixture';
import { DiligenciasPage } from '../pages/diligencias.page';

test.describe('Módulo Diligencias', () => {
    test('TC-DIL-001: Listado de diligencias carga correctamente', async ({ adminPage }) => {
        const diligencias = new DiligenciasPage(adminPage);
        await diligencias.navigate();
        await expect(diligencias.tabla).toBeVisible({ timeout: 15000 });
    });

    test('TC-DIL-002: Botón Nueva Diligencia visible', async ({ adminPage }) => {
        const diligencias = new DiligenciasPage(adminPage);
        await diligencias.navigate();
        await expect(diligencias.btnNuevaDiligencia).toBeVisible({ timeout: 15000 });
    });

    test('TC-DIL-003: Filtros visibles', async ({ adminPage }) => {
        const diligencias = new DiligenciasPage(adminPage);
        await diligencias.navigate();
        await expect(diligencias.filtroEstado).toBeVisible({ timeout: 15000 });
        await expect(diligencias.filtroTipo).toBeVisible({ timeout: 15000 });
    });

    test('TC-DIL-004: Click en fila navega al detalle', async ({ adminPage }) => {
        const diligencias = new DiligenciasPage(adminPage);
        await diligencias.navigate();
        await expect(diligencias.tabla).toBeVisible({ timeout: 15000 });
        const count = await diligencias.getRowCount();
        if (count > 0) {
            await diligencias.clickDiligencia(0);
            await adminPage.waitForURL('**/diligencias/**', { timeout: 10000 });
            expect(adminPage.url()).toContain('/diligencias/');
        }
    });

    test('TC-DIL-005: Modal de nueva diligencia se abre', async ({ adminPage }) => {
        const diligencias = new DiligenciasPage(adminPage);
        await diligencias.navigate();
        await expect(diligencias.btnNuevaDiligencia).toBeVisible({ timeout: 15000 });
        await diligencias.openNewDiligenciaModal();
        await expect(adminPage.locator('[data-testid="modal-diligencia"]')).toBeVisible({ timeout: 5000 });
    });
});

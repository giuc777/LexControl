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

    test('TC-TRA-006: Detalle muestra botón Volver', async ({ adminPage }) => {
        await adminPage.goto('/tramites/1');
        await expect(adminPage.locator('[data-testid="btn-volver"]')).toBeVisible({ timeout: 15000 });
    });

    test('TC-TRA-007: Botón Volver regresa al listado de trámites', async ({ adminPage }) => {
        await adminPage.goto('/tramites/1');
        const btnVolver = adminPage.locator('[data-testid="btn-volver"]');
        await expect(btnVolver).toBeVisible({ timeout: 15000 });
        await btnVolver.click();
        await adminPage.waitForURL('**/tramites', { timeout: 10000 });
        expect(adminPage.url()).toContain('/tramites');
    });

    test('TC-TRA-008: Modal de cambio de estado abre con todos sus campos', async ({ adminPage }) => {
        await adminPage.goto('/tramites/1');
        const btnCambiar = adminPage.getByRole('button', { name: 'Cambiar Estado' });
        await expect(btnCambiar).toBeVisible({ timeout: 15000 });
        await btnCambiar.click();

        await expect(adminPage.locator('.modal-title', { hasText: 'Cambiar Estado del Trámite' }))
            .toBeVisible({ timeout: 10000 });
        await expect(adminPage.locator('.estado-resumen')).toBeVisible();
        await expect(adminPage.locator('#estadoNuevo')).toBeVisible();
        await expect(adminPage.locator('#fechaResolucion')).toBeVisible();
        await expect(adminPage.locator('#resumenResolucion')).toBeVisible();
        await expect(adminPage.getByRole('button', { name: 'Guardar Estado' })).toBeVisible();
        await expect(adminPage.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    });

    test('TC-TRA-009: El modal de cambio de estado cierra con Escape', async ({ adminPage }) => {
        await adminPage.goto('/tramites/1');
        const btnCambiar = adminPage.getByRole('button', { name: 'Cambiar Estado' });
        await expect(btnCambiar).toBeVisible({ timeout: 15000 });
        await btnCambiar.click();
        await expect(adminPage.locator('#estadoNuevo')).toBeVisible({ timeout: 10000 });

        await adminPage.keyboard.press('Escape');
        await expect(adminPage.locator('#estadoNuevo')).toBeHidden({ timeout: 5000 });
    });

    test('TC-TRA-010: Detalle muestra la sección de notas internas', async ({ adminPage }) => {
        await adminPage.goto('/tramites/1');
        await expect(adminPage.locator('[data-testid="btn-agregar-nota"]'))
            .toBeVisible({ timeout: 15000 });
        await expect(adminPage.locator('.detalle-seccion[aria-label="Notas internas"] h3'))
            .toHaveText('Notas internas');
    });

    test('TC-TRA-011: Agregar una nota desde el detalle', async ({ adminPage }) => {
        const contenido = `Nota de prueba e2e ${Date.now()}`;

        await adminPage.goto('/tramites/1');
        await adminPage.locator('[data-testid="btn-agregar-nota"]').click();
        await expect(adminPage.locator('#notaContenido')).toBeVisible({ timeout: 10000 });
        await adminPage.locator('#notaContenido').fill(contenido);
        await adminPage.getByRole('button', { name: 'Guardar Nota' }).click();

        await expect(adminPage.locator('.nota-card').filter({ hasText: contenido }))
            .toBeVisible({ timeout: 10000 });
    });

    test('TC-TRA-012: Eliminar una nota con confirmación', async ({ adminPage }) => {
        const contenido = `Nota a eliminar e2e ${Date.now()}`;

        await adminPage.goto('/tramites/1');
        await adminPage.locator('[data-testid="btn-agregar-nota"]').click();
        await adminPage.locator('#notaContenido').fill(contenido);
        await adminPage.getByRole('button', { name: 'Guardar Nota' }).click();

        const nota = adminPage.locator('.nota-card').filter({ hasText: contenido });
        await expect(nota).toBeVisible({ timeout: 10000 });

        adminPage.once('dialog', dialog => dialog.accept());
        await nota.locator('[data-testid="btn-eliminar-nota"]').click();

        await expect(nota).toBeHidden({ timeout: 10000 });
    });
});

import { test, expect } from '../fixtures/auth.fixture';
import { NotificacionesPage } from '../pages/notificaciones.page';

test.describe('Módulo Notificaciones OJ', () => {
    test('TC-NOT-001: Listado de notificaciones carga correctamente', async ({ adminPage }) => {
        const notificaciones = new NotificacionesPage(adminPage);
        await notificaciones.navigate();
        await expect(notificaciones.tabla).toBeVisible({ timeout: 15000 });
    });

    test('TC-NOT-002: Botón Nueva Notificación visible', async ({ adminPage }) => {
        const notificaciones = new NotificacionesPage(adminPage);
        await notificaciones.navigate();
        await expect(notificaciones.btnNuevaNotificacion).toBeVisible({ timeout: 15000 });
    });

    test('TC-NOT-003: Filtros visibles', async ({ adminPage }) => {
        const notificaciones = new NotificacionesPage(adminPage);
        await notificaciones.navigate();
        await expect(notificaciones.filtroEstado).toBeVisible({ timeout: 15000 });
        await expect(notificaciones.filtroTipo).toBeVisible({ timeout: 15000 });
    });

    test('TC-NOT-004: Click en fila navega al detalle', async ({ adminPage }) => {
        const notificaciones = new NotificacionesPage(adminPage);
        await notificaciones.navigate();
        await expect(notificaciones.tabla).toBeVisible({ timeout: 15000 });
        const count = await notificaciones.getRowCount();
        if (count > 0) {
            await notificaciones.clickNotificacion(0);
            await adminPage.waitForURL('**/notificaciones-oj/**', { timeout: 10000 });
            expect(adminPage.url()).toContain('/notificaciones-oj/');
        }
    });

    test('TC-NOT-005: Sidebar muestra módulo Notificaciones', async ({ adminPage }) => {
        const sidebar = adminPage.locator('[data-testid="sidebar"]');
        await expect(sidebar).toBeVisible();
        const text = await sidebar.textContent();
        expect(text).toContain('Notificaciones');
    });

    test('TC-NOT-006: Abre modal de nueva notificación con sus campos', async ({ adminPage }) => {
        const notificaciones = new NotificacionesPage(adminPage);
        await notificaciones.navigate();
        await notificaciones.openNewNotificacionModal();
        await expect(notificaciones.modal).toBeVisible({ timeout: 10000 });
        await expect(notificaciones.selectExpediente).toBeVisible();
        await expect(notificaciones.selectTipo).toBeVisible();
        await expect(notificaciones.inputFecha).toBeVisible();
        await expect(notificaciones.btnVerificarDuplicado).toBeVisible();
    });

    test('TC-NOT-007: Badge OJ visible en notificaciones pendientes', async ({ adminPage }) => {
        const notificaciones = new NotificacionesPage(adminPage);
        await notificaciones.navigate();
        await expect(notificaciones.tabla).toBeVisible({ timeout: 15000 });
        const count = await notificaciones.badgeOj.count();
        if (count > 0) {
            await expect(notificaciones.badgeOj.first()).toBeVisible();
        }
    });

    test('TC-NOT-008: Verificar duplicado no produce error', async ({ adminPage }) => {
        const notificaciones = new NotificacionesPage(adminPage);
        await notificaciones.navigate();
        await notificaciones.openNewNotificacionModal();
        await expect(notificaciones.modal).toBeVisible({ timeout: 10000 });
        await notificaciones.btnVerificarDuplicado.click();
        // El modal permanece abierto tras la verificación.
        await expect(notificaciones.modal).toBeVisible();
    });

    test('TC-NOT-009: El enlace del sidebar navega a /notificaciones-oj', async ({ adminPage }) => {
        // Regresión: la ruta del módulo venía obsoleta y redirigía al dashboard.
        await adminPage.goto('/dashboard');
        const enlace = adminPage.locator('[data-testid="sidebar"] a', { hasText: 'Notificaciones' });
        await expect(enlace).toBeVisible({ timeout: 15000 });
        await enlace.click();
        await adminPage.waitForURL('**/notificaciones-oj', { timeout: 10000 });
        expect(adminPage.url()).toContain('/notificaciones-oj');
    });
});

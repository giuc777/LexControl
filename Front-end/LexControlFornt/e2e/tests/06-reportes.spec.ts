import { test, expect } from '../fixtures/auth.fixture';
import { ReportesPage } from '../pages/reportes.page';

test.describe('Módulo Reportes', () => {
    test('TC-REP-001: Página de reportes carga correctamente', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await expect(adminPage.locator('.page-title')).toContainText('Reportes', { timeout: 15000 });
    });

    test('TC-REP-002: Categorías de reporte visibles', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await expect(adminPage.locator('[data-testid="reportes-categorias"]')).toBeVisible({ timeout: 15000 });
    });

    test('TC-REP-003: Sidebar funciona en reportes', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await expect(adminPage.locator('[data-testid="sidebar"]')).toBeVisible();
    });

    test('TC-REP-004: Abre reporte de Clientes por Tipo', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await reportes.abrirCategoria('clientes');
        await expect(reportes.reporteVisible('clientes')).toBeVisible({ timeout: 15000 });
    });

    test('TC-REP-005: Abre reporte de Expedientes', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await reportes.abrirCategoria('expedientes');
        await expect(reportes.reporteVisible('expedientes')).toBeVisible({ timeout: 15000 });
    });

    test('TC-REP-006: Abre reporte de Agenda y Audiencias', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await reportes.abrirCategoria('agenda');
        await expect(reportes.reporteVisible('agenda')).toBeVisible({ timeout: 15000 });
    });

    test('TC-REP-007: Abre reporte de Trámites', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await reportes.abrirCategoria('tramites');
        await expect(reportes.reporteVisible('tramites')).toBeVisible({ timeout: 15000 });
    });

    test('TC-REP-008: Abre reporte de Notificaciones OJ', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await reportes.abrirCategoria('notificaciones');
        await expect(reportes.reporteVisible('notificaciones')).toBeVisible({ timeout: 15000 });
    });

    test('TC-REP-009: Abre reporte de Diligencias y Alertas', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await reportes.abrirCategoria('diligencias');
        await expect(reportes.reporteVisible('diligencias')).toBeVisible({ timeout: 15000 });
    });

    test('TC-REP-010: Abre reporte de Rendimiento del Bufete', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await reportes.abrirCategoria('rendimiento');
        await expect(reportes.reporteVisible('rendimiento')).toBeVisible({ timeout: 15000 });
    });

    test('TC-REP-011: Volver a reportes funciona', async ({ adminPage }) => {
        const reportes = new ReportesPage(adminPage);
        await reportes.navigate();
        await reportes.abrirCategoria('clientes');
        await expect(reportes.reporteVisible('clientes')).toBeVisible({ timeout: 15000 });
        await reportes.btnVolver.click();
        await expect(adminPage.locator('[data-testid="reportes-categorias"]')).toBeVisible({ timeout: 10000 });
    });
});
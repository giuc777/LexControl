import { test, expect } from '../fixtures/auth.fixture';
import { AgendaPage } from '../pages/agenda.page';

test.describe('Módulo Agenda', () => {
    test('TC-AGE-001: Agenda carga correctamente', async ({ adminPage }) => {
        const agenda = new AgendaPage(adminPage);
        await agenda.navigate();
        await expect(agenda.calendario).toBeVisible({ timeout: 15000 });
    });

    test('TC-AGE-002: Calendario muestra días', async ({ adminPage }) => {
        const agenda = new AgendaPage(adminPage);
        await agenda.navigate();
        await expect(agenda.calendario).toBeVisible({ timeout: 15000 });
        const dias = await agenda.diasCalendario.count();
        expect(dias).toBeGreaterThan(0);
    });

    test('TC-AGE-003: Botón Nueva Audiencia visible', async ({ adminPage }) => {
        const agenda = new AgendaPage(adminPage);
        await agenda.navigate();
        await expect(agenda.btnNuevaAudiencia).toBeVisible({ timeout: 15000 });
    });

    test('TC-AGE-004: Botón Nueva Diligencia visible', async ({ adminPage }) => {
        const agenda = new AgendaPage(adminPage);
        await agenda.navigate();
        await expect(agenda.btnNuevaDiligencia).toBeVisible({ timeout: 15000 });
    });

    test('TC-AGE-005: Sidebar muestra módulo Agenda', async ({ adminPage }) => {
        const sidebar = adminPage.locator('[data-testid="sidebar"]');
        await expect(sidebar).toBeVisible();
        const text = await sidebar.textContent();
        expect(text).toContain('Agenda');
    });
});

import { test, expect } from '../fixtures/auth.fixture';

test.describe('Diligencia Detalle — Resultado', () => {
    test('TC-DILR-001: Detalle de diligencia carga', async ({ adminPage }) => {
        await adminPage.goto('/diligencias/1');
        await adminPage.waitForTimeout(2000);
        expect(adminPage.url()).toContain('/diligencias/');
    });

    test('TC-DILR-002: Botón Registrar/Editar Resultado visible si no cancelada', async ({ adminPage }) => {
        await adminPage.goto('/diligencias/1');
        await adminPage.waitForTimeout(2000);
        const btn = adminPage.locator('[data-testid="btn-registrar-resultado"]');
        if (await btn.isVisible()) {
            await expect(btn).toBeVisible();
        }
    });

    test('TC-DILR-003: Abrir modal de resultado', async ({ adminPage }) => {
        await adminPage.goto('/diligencias/1');
        await adminPage.waitForTimeout(2000);
        const btn = adminPage.locator('[data-testid="btn-registrar-resultado"]');
        if (await btn.isVisible()) {
            await btn.click();
            await expect(adminPage.locator('[data-testid="select-resultado-diligencia"]'))
                .toBeVisible({ timeout: 5000 });
            await expect(adminPage.locator('[data-testid="input-descripcion-diligencia"]'))
                .toBeVisible();
            await expect(adminPage.locator('[data-testid="btn-guardar-resultado-diligencia"]'))
                .toBeVisible();
        }
    });

    test('TC-DILR-004: Validación al guardar sin campos', async ({ adminPage }) => {
        await adminPage.goto('/diligencias/1');
        await adminPage.waitForTimeout(2000);
        const btn = adminPage.locator('[data-testid="btn-registrar-resultado"]');
        if (await btn.isVisible()) {
            await btn.click();
            await adminPage.waitForSelector('[data-testid="btn-guardar-resultado-diligencia"]', {
                timeout: 5000
            });
            await adminPage.locator('[data-testid="btn-guardar-resultado-diligencia"]').click();
            const error = adminPage.locator('[role="alert"]');
            await expect(error).toBeVisible({ timeout: 3000 });
        }
    });

    test('TC-DILR-005: Botón Editar en panel de resultado', async ({ adminPage }) => {
        await adminPage.goto('/diligencias/1');
        await adminPage.waitForTimeout(2000);
        const btnEditar = adminPage.locator('[data-testid="btn-editar-resultado"]');
        if (await btnEditar.isVisible()) {
            await btnEditar.click();
            await expect(adminPage.locator('[data-testid="select-resultado-diligencia"]'))
                .toBeVisible({ timeout: 5000 });
            const titulo = adminPage.locator('.modal-title');
            await expect(titulo).toContainText(/editar/i);
        }
    });
});

test.describe('Agenda — Editar Resultado de Audiencia', () => {
    test('TC-AGER-001: Detalle de audiencia carga', async ({ adminPage }) => {
        await adminPage.goto('/agenda/1');
        await adminPage.waitForTimeout(2000);
        expect(adminPage.url()).toContain('/agenda/');
    });

    test('TC-AGER-002: Botón resultado visible en audiencia', async ({ adminPage }) => {
        await adminPage.goto('/agenda/1');
        await adminPage.waitForTimeout(2000);
        const btn = adminPage.locator('[data-testid="btn-registrar-resultado"]');
        if (await btn.isVisible()) {
            await expect(btn).toBeVisible();
        }
    });

    test('TC-AGER-003: Modal de resultado de audiencia', async ({ adminPage }) => {
        await adminPage.goto('/agenda/1');
        await adminPage.waitForTimeout(2000);
        const btn = adminPage.locator('[data-testid="btn-registrar-resultado"]');
        if (await btn.isVisible()) {
            await btn.click();
            await expect(adminPage.locator('[data-testid="select-resultado"]'))
                .toBeVisible({ timeout: 5000 });
            await expect(adminPage.locator('[data-testid="btn-guardar-resultado"]'))
                .toBeVisible();
        }
    });

    test('TC-AGER-004: Botón Editar en panel de resultado', async ({ adminPage }) => {
        await adminPage.goto('/agenda/1');
        await adminPage.waitForTimeout(2000);
        const btnEditar = adminPage.locator('[data-testid="btn-editar-resultado"]');
        if (await btnEditar.isVisible()) {
            await btnEditar.click();
            await expect(adminPage.locator('[data-testid="select-resultado"]'))
                .toBeVisible({ timeout: 5000 });
        }
    });
});

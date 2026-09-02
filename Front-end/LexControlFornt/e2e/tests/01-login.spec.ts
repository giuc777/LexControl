import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/login.page';

test.describe('Módulo Login', () => {
    test('TC-LOGIN-001: Login exitoso con credenciales válidas', async ({ page }) => {
        const login = new LoginPage(page);
        await login.navigate();
        await login.login('admin', 'Test1234!');
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        expect(page.url()).toContain('/dashboard');
    });

    test('TC-LOGIN-002: Login fallido con contraseña incorrecta', async ({ page }) => {
        const login = new LoginPage(page);
        await login.navigate();
        await login.login('admin', 'wrongpassword');
        await expect(login.errorAlert).toBeVisible({ timeout: 10000 });
    });

    test('TC-LOGIN-003: Login fallido con usuario inexistente', async ({ page }) => {
        const login = new LoginPage(page);
        await login.navigate();
        await login.login('noexiste', 'Test1234!');
        await expect(login.errorAlert).toBeVisible({ timeout: 10000 });
    });

    test('TC-LOGIN-004: Campos obligatorios vacíos', async ({ page }) => {
        const login = new LoginPage(page);
        await login.navigate();
        await login.loginBtn.click();
        await expect(page.url()).toContain('/login');
    });

    test('TC-LOGIN-005: Cierre de sesión', async ({ adminPage }) => {
        await adminPage.locator('.btn-logout').click();
        await adminPage.waitForURL('**/login', { timeout: 10000 });
        expect(adminPage.url()).toContain('/login');
    });
});

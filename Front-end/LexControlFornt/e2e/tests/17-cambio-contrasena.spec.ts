import { test, expect } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/login.page';

/* Flujo end-to-end del cambio de contraseña contra la BD de pruebas real
   (Ajustes > Seguridad → PUT /api/perfil/contrasena → Azure DB_Lexcontrol_Test).

   El test deja la contraseña exactamente como estaba al final (se restaura
   desde la propia UI, cosa posible porque `admin123#` cumple la política de
   seguridad). Si el test falla a mitad de camino, la contraseña puede quedar
   en `E2e#Temp2026`; en ese caso restaurarla manualmente desde Ajustes o con
   el hash del seed en la BD. */
test.describe('Cambio de contraseña (integración front ↔ API ↔ BD)', () => {
    const CONTRASENA_ACTUAL = 'admin123#';
    const CONTRASENA_TEMPORAL = 'E2e#Temp2026';

    // Los tests que no mutan la contraseña van primero; el que la cambia,
    // al final, para no romper el login del fixture (admin/admin123#).
    test('TC-CAMBIO-001: Confirmación que no coincide bloquea el envío', async ({ adminPage }) => {
        await adminPage.goto('/ajustes');
        await adminPage.locator('#contrasenaActual').fill(CONTRASENA_ACTUAL);
        await adminPage.locator('#contrasenaNueva').fill('Otra#Clave99');
        await adminPage.locator('#confirmacion').fill('NoCoincide#1');
        await adminPage.locator('app-seguridad-card button[type="submit"]').click();

        await expect(adminPage.locator('app-seguridad-card .form-error'))
            .toContainText('Complete los tres campos', { timeout: 10000 });
        // No debe aparecer el toast de éxito.
        await expect(adminPage.locator('.lex-toast.show')).toHaveCount(0);
    });

    test('TC-CAMBIO-002: Nueva contraseña igual a la actual bloquea el envío', async ({ adminPage }) => {
        await adminPage.goto('/ajustes');
        await adminPage.locator('#contrasenaActual').fill(CONTRASENA_ACTUAL);
        await adminPage.locator('#contrasenaNueva').fill(CONTRASENA_ACTUAL);
        await adminPage.locator('#confirmacion').fill(CONTRASENA_ACTUAL);
        await adminPage.locator('app-seguridad-card button[type="submit"]').click();

        await expect(adminPage.locator('app-seguridad-card .form-error'))
            .toContainText('Complete los tres campos', { timeout: 10000 });
        await expect(adminPage.locator('.lex-toast.show')).toHaveCount(0);
    });

    test('TC-CAMBIO-003: Cambiar contraseña, entrar con la nueva, rechazar la anterior y restaurar', async ({ page }) => {
        // Múltiples logins + BCrypt + latencia Azure: necesita más margen.
        test.setTimeout(150000);
        const login = new LoginPage(page);

        // 1. Sesión con la contraseña actual.
        await login.navigate();
        await login.login('admin', CONTRASENA_ACTUAL);
        await page.waitForURL('**/dashboard', { timeout: 15000 });

        // 2. Cambio desde Ajustes > Seguridad (tarjeta app-seguridad-card).
        await page.goto('/ajustes');
        await page.locator('#contrasenaActual').fill(CONTRASENA_ACTUAL);
        await page.locator('#contrasenaNueva').fill(CONTRASENA_TEMPORAL);
        await page.locator('#confirmacion').fill(CONTRASENA_TEMPORAL);
        await page.locator('app-seguridad-card button[type="submit"]').click();
        await expect(page.locator('.lex-toast.show'))
            .toContainText('Contraseña actualizada correctamente', { timeout: 15000 });

        // 3. Cerrar sesión y volver a entrar con la contraseña nueva.
        await page.locator('.btn-logout').click();
        await page.waitForURL('**/login', { timeout: 10000 });
        await login.login('admin', CONTRASENA_TEMPORAL);
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        expect(page.url()).toContain('/dashboard');

        // 4. La contraseña anterior ya no autentica.
        await page.locator('.btn-logout').click();
        await page.waitForURL('**/login', { timeout: 10000 });
        await login.login('admin', CONTRASENA_ACTUAL);
        await expect(login.errorAlert).toBeVisible({ timeout: 10000 });

        // 5. Restaurar la contraseña original desde la misma UI.
        await login.login('admin', CONTRASENA_TEMPORAL);
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        await page.goto('/ajustes');
        await page.locator('#contrasenaActual').fill(CONTRASENA_TEMPORAL);
        await page.locator('#contrasenaNueva').fill(CONTRASENA_ACTUAL);
        await page.locator('#confirmacion').fill(CONTRASENA_ACTUAL);
        await page.locator('app-seguridad-card button[type="submit"]').click();
        await expect(page.locator('.lex-toast.show'))
            .toContainText('Contraseña actualizada correctamente', { timeout: 15000 });

        // 6. Verificar que la contraseña original quedó restaurada.
        await page.locator('.btn-logout').click();
        await page.waitForURL('**/login', { timeout: 10000 });
        await login.login('admin', CONTRASENA_ACTUAL);
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        expect(page.url()).toContain('/dashboard');
    });
});

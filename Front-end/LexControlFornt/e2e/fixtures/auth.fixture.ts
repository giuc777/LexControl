import { test as base, Page, BrowserContext } from '@playwright/test';

/* Fixture que provee una página ya autenticada como Admin.
   Evita repetir el login en cada test. El login se reintenta porque el
   dev server + proxy pueden tardar en el primer arranque (flacuidad de entorno). */
export const test = base.extend<{ adminPage: Page }>({
    adminPage: async ({ browser }, use) => {
        const context: BrowserContext = await browser.newContext({
            ignoreHTTPSErrors: true
        });
        const page: Page = await context.newPage();

        let autenticado = false;
        for (let intento = 1; intento <= 3 && !autenticado; intento++) {
            await page.goto('/login');
            await page.locator('[data-testid="usuario"]').fill('admin');
            await page.locator('[data-testid="contrasena"]').fill('admin123#');
            await page.locator('[data-testid="btn-login"]').click();
            try {
                await page.waitForURL('**/dashboard', { timeout: 15000 });
                autenticado = true;
            } catch (e) {
                if (intento === 3) throw e;
            }
        }

        await use(page);

        await context.close();
    }
});

export { expect } from '@playwright/test';

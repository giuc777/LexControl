import { test as base, Page, BrowserContext } from '@playwright/test';

/* Fixture que provee una página ya autenticada como Admin.
   Evita repetir el login en cada test. */
export const test = base.extend<{ adminPage: Page }>({
    adminPage: async ({ browser }, use) => {
        const context: BrowserContext = await browser.newContext({
            ignoreHTTPSErrors: true
        });
        const page: Page = await context.newPage();

        await page.goto('/login');
        await page.locator('[data-testid="usuario"]').fill('admin');
        await page.locator('[data-testid="contrasena"]').fill('Test1234!');
        await page.locator('[data-testid="btn-login"]').click();
        await page.waitForURL('**/dashboard', { timeout: 15000 });

        await use(page);

        await context.close();
    }
});

export { expect } from '@playwright/test';

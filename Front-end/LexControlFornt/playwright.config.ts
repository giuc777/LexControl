import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e/tests',
    fullyParallel: false,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 1 : 0,
    workers: 1,
    reporter: [['html', { open: 'never' }]],

    use: {
        baseURL: 'http://localhost:4200',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        ignoreHTTPSErrors: true,
        // El dev server (ng serve) + contexto de navegador nuevo por test
        // pueden tardar en servir los chunks lazy; márgenes amplios para
        // evitar falsos negativos de entorno.
        timeout: 60000,
        actionTimeout: 15000,
        navigationTimeout: 25000
    },

    expect: {
        timeout: 10000
    },

    projects: [
        {
            name: 'msedge',
            use: { ...devices['Desktop Edge'] }
        }
    ],

    webServer: {
        command: 'ng serve',
        url: 'http://localhost:4200',
        reuseExistingServer: true,
        timeout: 120000
    }
});

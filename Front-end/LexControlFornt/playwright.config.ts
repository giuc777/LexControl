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
        ignoreHTTPSErrors: true
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

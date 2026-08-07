import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir      : './e2e',
    fullyParallel: true,
    forbidOnly   : !!process.env.CI,
    retries      : process.env.CI ? 2 : 0,
    workers      : process.env.CI ? 1 : undefined,
    timeout      : 30_000,
    expect       : {
        timeout: 5000,
    },
    reporter: process.env.CI
        ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report', }]]
        : 'list',
    use: {
        baseURL   : 'http://localhost:5001',
        trace     : 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command            : 'npm run dev',
        url                : 'http://localhost:5001',
        reuseExistingServer: !process.env.CI,
        timeout            : 120_000,
    },
    projects: [
        {
            name: 'chromium',
            use : { browserName: 'chromium', },
        }
    ],
});

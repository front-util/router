import { expect, test } from '@playwright/test';

import { expectRoute, readDebug } from './utils';

test.describe('history stability', () => {
    test('in-app navigation tracks entries and back/forward correctly', async({ page, }) => {
        await page.goto('/app1');
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');

        const debug = readDebug(page);

        await expect.poll(debug.entriesCount).toBe(1);
        await expect.poll(debug.canGoBack).toBe(false);

        await page.getByTestId('mini-app-1-nav-about').click();
        await expect(page).toHaveURL(/\/app1#\/about/);
        await expect.poll(debug.entriesCount).toBe(2);
        await expect.poll(debug.canGoBack).toBe(true);
        await expect.poll(debug.prevHash).toBe('login');

        await page.getByTestId('mini-app-1-nav-login').click();
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expect.poll(debug.entriesCount).toBe(3);

        await page.getByTestId('mini-app-1-nav-back').click();
        await expect(page).toHaveURL(/\/app1#\/about/);
        await expectRoute(page, 1, 'about');
        await expect.poll(debug.canGoForward).toBe(true);

        await page.getByTestId('mini-app-1-nav-prev').click();
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');
        await expect.poll(debug.canGoBack).toBe(false);
        await expect.poll(debug.canGoForward).toBe(true);
    });

    test('browser back from another host page keeps the mini-app inside its host page', async({ page, }) => {
        await page.goto('/app1');
        await expect(page).toHaveURL(/\/app1#\/login/);

        await page.getByTestId('mini-app-1-nav-about').click();
        await expect(page).toHaveURL(/\/app1#\/about/);

        await page.getByTestId('link-app2').click();
        await expect(page).toHaveURL(/\/app2#\/signup/);

        await page.goBack();
        await expect(page).toHaveURL(/\/app1#\/about/);
        await expectRoute(page, 1, 'about');

        await page.getByTestId('mini-app-1-nav-back').click();
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');
        await expect(page.getByTestId('page-app1')).toBeVisible();
    });
});

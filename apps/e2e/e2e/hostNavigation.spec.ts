import { expect, test } from '@playwright/test';

import { collectConsoleErrors, expectNoConsoleErrors, expectRoute } from './utils';

test.describe('host navigation', () => {
    test('home page renders with the host navigation links', async({ page, }) => {
        await page.goto('/');

        await expect(page.getByTestId('page-home')).toBeVisible();
        await expect(page.getByTestId('link-home')).toBeVisible();
        await expect(page.getByTestId('link-app1')).toBeVisible();
        await expect(page.getByTestId('link-app2')).toBeVisible();
        await expect(page.getByTestId('link-dual')).toBeVisible();
    });

    test('app1 embeds mini app 1 and rewrites the bare host URL to the guest home hash', async({ page, }) => {
        await page.goto('/');
        await page.getByTestId('link-app1').click();

        await expect(page).toHaveURL(/\/app1#\/login/);
        await expect(page.getByTestId('page-app1')).toBeVisible();
        await expectRoute(page, 1, 'login');
        await expect(page.getByTestId('debug-hash')).toHaveText('login');
    });

    test('app2 embeds mini app 2 and rewrites the bare host URL to the guest home hash', async({ page, }) => {
        await page.goto('/');
        await page.getByTestId('link-app2').click();

        await expect(page).toHaveURL(/\/app2#\/signup/);
        await expect(page.getByTestId('page-app2')).toBeVisible();
        await expectRoute(page, 2, 'signup');
        await expect(page.getByTestId('debug-hash')).toHaveText('signup');
    });

    test('unknown host routes render the host 404 page', async({ page, }) => {
        await page.goto('/definitely-not-a-page');

        await expect(page.getByTestId('page-host-not-found')).toBeVisible();
    });

    test('in-app and host navigation never reload the page', async({ page, }) => {
        const errors = collectConsoleErrors(page);

        await page.goto('/');
        await page.getByTestId('link-app1').click();
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expect(page.getByTestId('boot-count')).toHaveText('boot: 1');

        await page.getByTestId('mini-app-1-nav-about').click();
        await expect(page).toHaveURL(/\/app1#\/about/);
        await expect(page.getByTestId('boot-count')).toHaveText('boot: 1');

        await page.getByTestId('link-app2').click();
        await expect(page).toHaveURL(/\/app2#\/signup/);
        await expect(page.getByTestId('boot-count')).toHaveText('boot: 1');

        expectNoConsoleErrors(errors);
    });
});

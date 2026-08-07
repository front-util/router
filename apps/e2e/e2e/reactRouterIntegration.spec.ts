import { expect, test } from '@playwright/test';

import { collectConsoleErrors, expectNoConsoleErrors, expectRoute } from './utils';

test.describe('react-router integration', () => {
    test('hash-only navigation does not remount the host page', async({ page, }) => {
        await page.goto('/app1');
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expect(page.getByTestId('app1-mount-count')).toHaveText('1');

        await page.getByTestId('mini-app-1-nav-about').click();
        await expect(page).toHaveURL(/\/app1#\/about/);
        await expect(page.getByTestId('app1-mount-count')).toHaveText('1');

        await page.getByTestId('mini-app-1-nav-login').click();
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expect(page.getByTestId('app1-mount-count')).toHaveText('1');

        await page.getByTestId('mini-app-1-nav-back').click();
        await expect(page).toHaveURL(/\/app1#\/about/);
        await expect(page.getByTestId('app1-mount-count')).toHaveText('1');
        await expect(page.getByTestId('page-app1')).toBeVisible();
    });

    test('host pages are remounted when navigating away and back', async({ page, }) => {
        await page.goto('/app1');
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expect(page.getByTestId('app1-mount-count')).toHaveText('1');

        await page.getByTestId('link-app2').click();
        await expect(page).toHaveURL(/\/app2#\/signup/);
        await expect(page.getByTestId('app2-mount-count')).toHaveText('1');

        await page.getByTestId('link-app1').click();
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expect(page.getByTestId('app1-mount-count')).toHaveText('2');
    });

    test('deep link straight into a mini app renders without a reload', async({ page, }) => {
        await page.goto('/app1#/login');

        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');
        await expect(page.getByTestId('app1-mount-count')).toHaveText('1');
        await expect(page.getByTestId('boot-count')).toHaveText('boot: 1');
    });

    test('browser back from another host page restores the previous in-app route after auth changes', async({ page, }) => {
        await page.goto('/app1');
        await expect(page).toHaveURL(/\/app1#\/login/);

        await page.getByTestId('toggle-auth').click();
        await expect(page).toHaveURL(/\/app1#\/dashboard/);

        await page.getByTestId('mini-app-1-nav-user').click();
        await expect(page).toHaveURL(/\/app1#\/users\/42\?tab=prefs/);
        await expectRoute(page, 1, 'users');

        await page.getByTestId('link-app2').click();
        await expect(page).toHaveURL(/\/app2#\/overview/);

        await page.goBack();
        await expect(page).toHaveURL(/\/app1#\/users\/42\?tab=prefs/);
        await expectRoute(page, 1, 'users');
    });

    test('browser back/forward across host pages renders the correct mini app', async({ page, }) => {
        const errors = collectConsoleErrors(page);

        await page.goto('/app1');
        await expect(page).toHaveURL(/\/app1#\/login/);

        await page.getByTestId('link-app2').click();
        await expect(page).toHaveURL(/\/app2#\/signup/);
        await expectRoute(page, 2, 'signup');

        await page.goBack();
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');
        await expect(page.getByTestId('boot-count')).toHaveText('boot: 1');

        await page.goForward();
        await expect(page).toHaveURL(/\/app2#\/signup/);
        await expectRoute(page, 2, 'signup');
        await expect(page.getByTestId('boot-count')).toHaveText('boot: 1');

        expectNoConsoleErrors(errors);
    });
});

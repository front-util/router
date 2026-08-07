import { expect, test } from '@playwright/test';

import { expectRoute } from './utils';

test.describe('conditional route groups', () => {
    test('guest sees the login route; authorizing switches to dashboard', async({ page, }) => {
        await page.goto('/app1');

        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');

        await page.getByTestId('toggle-auth').click();
        await expect(page).toHaveURL(/\/app1#\/dashboard/);
        await expectRoute(page, 1, 'dashboard');
    });

    test('deauthorizing rewrites a protected hash back to the guest home', async({ page, }) => {
        await page.goto('/app1');
        await page.getByTestId('toggle-auth').click();
        await expectRoute(page, 1, 'dashboard');

        await page.getByTestId('mini-app-1-nav-settings').click();
        await expect(page).toHaveURL(/\/app1#\/settings/);
        await expectRoute(page, 1, 'settings');

        await page.getByTestId('toggle-auth').click();
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');
    });

    test('a protected hash visited while guest renders not-found, then becomes reachable', async({ page, }) => {
        await page.goto('/app1');
        await expectRoute(page, 1, 'login');

        await page.getByTestId('mini-app-1-nav-dashboard').click();
        await expect(page).toHaveURL(/\/app1#\/dashboard/);
        await expectRoute(page, 1, 'not-found');

        await page.getByTestId('toggle-auth').click();
        await expectRoute(page, 1, 'dashboard');
    });

    test('app2 guest and authorized route groups switch the home hash too', async({ page, }) => {
        await page.goto('/app2');

        await expect(page).toHaveURL(/\/app2#\/signup/);
        await expectRoute(page, 2, 'signup');

        await page.getByTestId('toggle-auth').click();
        await expect(page).toHaveURL(/\/app2#\/overview/);
        await expectRoute(page, 2, 'overview');

        await page.getByTestId('toggle-auth').click();
        await expect(page).toHaveURL(/\/app2#\/signup/);
        await expectRoute(page, 2, 'signup');
    });
});

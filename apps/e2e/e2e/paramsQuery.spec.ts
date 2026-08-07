import { expect, test } from '@playwright/test';

import { expectRoute, readDebug } from './utils';

test.describe('params and query parsing', () => {
    test('app1 renders route params and query', async({ page, }) => {
        await page.goto('/app1');
        await page.getByTestId('toggle-auth').click();
        await expectRoute(page, 1, 'dashboard');

        await page.getByTestId('mini-app-1-nav-user').click();

        await expect(page).toHaveURL(/\/app1#\/users\/42\?tab=prefs/);
        await expectRoute(page, 1, 'users');
        await expect(page.getByText('User: 42')).toBeVisible();
        await expect(page.getByTestId('mini-app-1-tab')).toHaveText('Tab: prefs');

        const debug = readDebug(page);

        await expect.poll(debug.params).toEqual({ userId: '42', });
        await expect.poll(debug.query).toEqual({ tab: 'prefs', });
        await expect.poll(debug.hash).toBe('users/42?tab=prefs');
    });

    test('app2 renders route params and query', async({ page, }) => {
        await page.goto('/app2');
        await page.getByTestId('toggle-auth').click();
        await expectRoute(page, 2, 'overview');

        await page.getByTestId('mini-app-2-nav-product').click();

        await expect(page).toHaveURL(/\/app2#\/products\/7\?color=silver/);
        await expectRoute(page, 2, 'products');
        await expect(page.getByText('Product: 7')).toBeVisible();
        await expect(page.getByTestId('mini-app-2-color')).toHaveText('Color: silver');

        const debug = readDebug(page);

        await expect.poll(debug.params).toEqual({ productId: '7', });
        await expect.poll(debug.query).toEqual({ color: 'silver', });
    });
});

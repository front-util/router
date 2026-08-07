import { expect, test } from '@playwright/test';

import { expectRoute } from './utils';

test.describe('hashRouter public API', () => {
    test('exposes current hash and route state through the singleton', async({ page, }) => {
        await page.goto('/app1');
        await expect(page).toHaveURL(/\/app1#\/login/);

        const state = await page.evaluate(() => ({
            hash        : window.__router.getHash(),
            entryHash   : window.__router.currentEntry.value.hash,
            hasAbout    : window.__router.hasPage('about'),
            hasDashboard: window.__router.hasPage('dashboard'),
        }));

        expect(state).toEqual({
            hash        : 'login',
            entryHash   : 'login',
            hasAbout    : true,
            hasDashboard: false,
        });
    });

    test('navigate() drives the router and notifies subscribers', async({ page, }) => {
        await page.goto('/app1');
        await expect(page).toHaveURL(/\/app1#\/login/);

        const before = Number(await page.getByTestId('debug-nav-events').textContent());

        await page.evaluate(() => window.__router.navigate('about'));

        await expect(page).toHaveURL(/\/app1#\/about/);
        await expectRoute(page, 1, 'about');
        await expect.poll(
            async() => Number(await page.getByTestId('debug-nav-events').textContent())
        ).toBe(before + 1);
    });

    test('goBack() via the exposed singleton', async({ page, }) => {
        await page.goto('/app1');
        await expect(page).toHaveURL(/\/app1#\/login/);

        await page.evaluate(() => window.__router.navigate('about'));
        await expect(page).toHaveURL(/\/app1#\/about/);
        await expectRoute(page, 1, 'about');

        await page.evaluate(() => window.__router.goBack());
        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');
    });

    test('navigateTo() substitutes params into a route pattern', async({ page, }) => {
        await page.goto('/app2');
        await page.getByTestId('toggle-auth').click();
        await expectRoute(page, 2, 'overview');

        await page.evaluate(() => window.__router.navigateTo('products/:productId', { productId: 7, }));

        await expect(page).toHaveURL(/\/app2#\/products\/7/);
        await expectRoute(page, 2, 'products');
        await expect(page.getByText('Product: 7')).toBeVisible();
    });
});

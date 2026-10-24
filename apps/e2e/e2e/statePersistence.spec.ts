import { expect, test } from '@playwright/test';

import { readDebug } from './utils';

test.describe('navigation state persistence across a page reload', () => {
    test('restores the entry state from history.state after a reload', async({ page, }) => {
        await page.goto('/deep-link');

        await page.evaluate(() => window.__router.navigate('profile/1001', { source: 'e2e', }));

        await expect(page).toHaveURL(/\/deep-link#\/profile\/1001/);

        const debug = readDebug(page);

        await expect.poll(debug.state).toEqual({ source: 'e2e', });

        // A reload keeps the state natively, so the router model must pick it
        // up instead of exposing an empty one. The host stack (react-router)
        // enriches the native state with its own keys (idx) on boot, so the
        // model is asserted against the native state, not a literal.
        await page.reload();

        await expect(page).toHaveURL(/\/deep-link#\/profile\/1001/);
        await expect(page.getByTestId('deep-link-route')).toHaveAttribute('data-route', 'profile');
        await expect(page.getByText('Profile: 1001')).toBeVisible();

        const nativeState = await page.evaluate(() => window.history.state);

        expect(nativeState).toMatchObject({ source: 'e2e', });
        await expect.poll(debug.state).toEqual(nativeState);
    });

    test('redirecting an unknown deep link to home keeps the restored state', async({ page, }) => {
        await page.goto('/deep-link');

        await page.evaluate(() => window.__router.navigate('unknown-shadow', { source: 'e2e', }));

        await expect(page).toHaveURL(/\/deep-link#\/unknown-shadow/);
        await expect(page.getByTestId('debug-state')).toHaveText(JSON.stringify({ source: 'e2e', }));

        // On the next boot the hash is not a configured route, so create()
        // redirects it to home: that replace must not discard the state
        await page.reload();

        await expect(page).toHaveURL(/\/deep-link#\/home/);

        const debug = readDebug(page);
        const nativeState = await page.evaluate(() => window.history.state);

        expect(nativeState).toMatchObject({ source: 'e2e', });
        await expect.poll(debug.state).toEqual(nativeState);
    });
});

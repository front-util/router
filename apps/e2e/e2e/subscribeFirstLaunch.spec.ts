import { expect, test } from '@playwright/test';

import { expectRoute } from './utils';

test.describe('hashRouter.subscribe on first launch', () => {
    test('reports notStarted on the first transition and success once the config is applied', async({ page, }) => {
        await page.goto('/app1#/login');

        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');

        const calls = await page.evaluate(() => window.__routerSubscribeCalls ?? []);

        const first = calls[0];

        expect(first, 'first navigationStatus must not be a false 404').not.toBe('notfound');
        expect(first.navigationStatus).toBe('notStarted');
        expect(first.entryHash).toBe('login');
        expect(first.getHash).toBe('login');
        expect(first.hasPage).toBe(false);
        expect(first.canGoBack).toBe(false);

        expect(calls.some((call) => call.navigationStatus === 'success'), 'must transition to success').toBe(true);

        const successCall = calls.find((call) => call.navigationStatus === 'success')!;

        expect(successCall.entryHash).toBe('login');
        expect(successCall.hasPage).toBe(true);
    });

    test('transitioning between pages keeps delivering accurate statuses', async({ page, }) => {
        await page.goto('/app1#/login');

        await expect(page).toHaveURL(/\/app1#\/login/);
        await expectRoute(page, 1, 'login');

        await page.evaluate(() => window.__router.navigate('about'));

        await expect(page).toHaveURL(/\/app1#\/about/);
        await expectRoute(page, 1, 'about');

        const calls = await page.evaluate(() => window.__routerSubscribeCalls ?? []);
        const last = calls[calls.length - 1];

        expect(last.navigationStatus).toBe('success');
        expect(last.entryHash).toBe('about');
        expect(last.hasPage).toBe(true);
    });
});

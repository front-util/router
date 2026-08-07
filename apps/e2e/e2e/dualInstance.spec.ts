import { expect, test } from '@playwright/test';

import { collectConsoleErrors, expectNoConsoleErrors, expectRoute } from './utils';

test.describe('dual instance', () => {
    test('mounts both mini apps at once on the shared singleton', async({ page, }) => {
        await page.goto('/dual');

        await expect(page.getByTestId('mini-app-1')).toBeVisible();
        await expect(page.getByTestId('mini-app-2')).toBeVisible();
        await expectRoute(page, 1, 'login');
        await expectRoute(page, 2, 'signup');
    });

    test('navigation through the last-mounted app updates the URL and route', async({ page, }) => {
        await page.goto('/dual');

        await page.getByTestId('mini-app-2-nav-landing').click();
        await expect(page).toHaveURL(/\/dual#\/landing/);
        await expectRoute(page, 2, 'landing');
    });

    test('auth toggle rewrites the shared URL to the authorized home hash', async({ page, }) => {
        await page.goto('/dual');
        await expect(page).toHaveURL(/\/dual#\/signup/);

        await page.getByTestId('toggle-auth').click();
        await expect(page).toHaveURL(/\/dual#\/overview/);
    });

    test('unmounting and remounting the second app keeps the host alive', async({ page, }) => {
        const errors = collectConsoleErrors(page);

        await page.goto('/dual');

        await page.getByTestId('toggle-mini-app-2').click();
        await expect(page.getByTestId('mini-app-2')).toHaveCount(0);
        await expect(page.getByTestId('mini-app-1')).toBeVisible();

        await page.getByTestId('toggle-mini-app-2').click();
        await expect(page.getByTestId('mini-app-2')).toBeVisible();

        expectNoConsoleErrors(errors);
    });
});

import { expect, type Page, test } from '@playwright/test';

import { readDebug } from './utils';

const expectDeepLinkRoute = async(page: Page, route: string) => {
    await expect(page.getByTestId('deep-link-route')).toHaveAttribute('data-route', route);
};

test.describe('deep link on a full page load', () => {
    test('renders route params when the page is loaded directly on a parameterized hash', async({ page, }) => {
        await page.goto('/deep-link#/profile/1001?tab=info');

        await expect(page).toHaveURL(/\/deep-link#\/profile\/1001\?tab=info/);
        await expectDeepLinkRoute(page, 'profile');
        await expect(page.getByText('Profile: 1001')).toBeVisible();
        await expect(page.getByTestId('deep-link-tab')).toHaveText('Tab: info');

        const debug = readDebug(page);

        await expect.poll(debug.params).toEqual({ id: '1001', });
        await expect.poll(debug.query).toEqual({ tab: 'info', });
    });

    test('keeps route params after a reload on the same parameterized hash', async({ page, }) => {
        await page.goto('/deep-link#/profile/1001?tab=info');
        await expectDeepLinkRoute(page, 'profile');

        // In-app navigation alone must not reload the page
        await expect(page.getByTestId('boot-count')).toHaveText('boot: 1');

        await page.reload();

        await expect(page).toHaveURL(/\/deep-link#\/profile\/1001\?tab=info/);
        await expectDeepLinkRoute(page, 'profile');
        await expect(page.getByText('Profile: 1001')).toBeVisible();

        const debug = readDebug(page);

        await expect.poll(debug.params).toEqual({ id: '1001', });
        await expect.poll(debug.query).toEqual({ tab: 'info', });
    });

    test('keeps route params for a pattern registered with a leading slash', async({ page, }) => {
        await page.goto('/deep-link#/orders/77');

        await expect(page).toHaveURL(/\/deep-link#\/orders\/77/);
        await expectDeepLinkRoute(page, 'profile');

        const debug = readDebug(page);

        await expect.poll(debug.params).toEqual({ orderId: '77', });
    });

    test('keeps route params when the query string contains a slash', async({ page, }) => {
        await page.goto('/deep-link#/profile/1001?redirect=/home');

        await expect(page).toHaveURL(/\/deep-link#\/profile\/1001\?redirect=\/home/);
        await expectDeepLinkRoute(page, 'profile');
        await expect(page.getByText('Profile: 1001')).toBeVisible();

        const debug = readDebug(page);

        await expect.poll(debug.params).toEqual({ id: '1001', });
        await expect.poll(debug.query).toEqual({ redirect: '/home', });
    });

    test('keeps route params after a client-side navigation away and a reload back', async({ page, }) => {
        await page.goto('/deep-link#/profile/1001?tab=info');
        await expectDeepLinkRoute(page, 'profile');

        await page.getByTestId('deep-link-nav-home').click();
        await expectDeepLinkRoute(page, 'home');

        await page.goBack();
        await expectDeepLinkRoute(page, 'profile');

        await page.reload();
        await expectDeepLinkRoute(page, 'profile');
        await expect(page.getByText('Profile: 1001')).toBeVisible();

        const debug = readDebug(page);

        await expect.poll(debug.params).toEqual({ id: '1001', });
    });
});

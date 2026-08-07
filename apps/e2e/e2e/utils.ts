import { expect, type Page } from '@playwright/test';

export const readDebug = (page: Page) => {
    const text = async(id: string) => (await page.getByTestId(id).textContent()) ?? '';

    return {
        hash        : () => text('debug-hash'),
        prevHash    : () => text('debug-prev-hash'),
        params      : async() => JSON.parse(await text('debug-params')) as Record<string, string>,
        query       : async() => JSON.parse(await text('debug-query')) as Record<string, string>,
        state       : async() => JSON.parse(await text('debug-state')) as Record<string, unknown>,
        canGoBack   : async() => (await text('debug-can-go-back')) === 'true',
        canGoForward: async() => (await text('debug-can-go-forward')) === 'true',
        entriesCount: async() => Number(await text('debug-entries-count')),
        navEvents   : async() => Number(await text('debug-nav-events')),
        url         : () => text('debug-url'),
    };
};

export const routeTestId = (app: 1 | 2) => `mini-app-${app}-route`;

/**
 * Asserts the currently rendered route inside the given mini app.
 */
export const expectRoute = async(page: Page, app: 1 | 2, route: string) => {
    await expect(page.getByTestId(routeTestId(app))).toHaveAttribute('data-route', route);
};

/**
 * Collects browser console errors + uncaught page errors for later assertion.
 */
export const collectConsoleErrors = (page: Page): string[] => {
    const errors: string[] = [];

    page.on('console', (message) => {
        if(message.type() === 'error') {
            errors.push(message.text());
        }
    });
    page.on('pageerror', (error) => {
        errors.push(String(error));
    });

    return errors;
};

export const expectNoConsoleErrors = (errors: string[]): void => {
    expect(errors).toEqual([]);
};

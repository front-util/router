import * as React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HashRouter, RouteComponent } from '../types';

import { createHashNavigation } from '../core/hashNavigation';
import { createHashRouter } from '../core/hashRouter';
import { ClientRouter } from '../react/ClientRouter';

const createTestComponent = (testId: string): RouteComponent => () => (
    React.createElement('div', { 'data-testid': testId, }, testId)
);

describe('ClientRouter', () => {
    const startUrl = 'http://localhost:3000';
    let router: HashRouter;
    let container: HTMLElement;
    let root: Root | null;

    const Home = createTestComponent('home');
    const About = createTestComponent('about');
    const NotFound = createTestComponent('not-found');
    const routes = { home: Home, about: About, };

    const renderRouter = () => {
        root = createRoot(container);

        act(() => {
            root!.render(React.createElement(ClientRouter, {
                router,
                routes,
                homeUrl          : 'home',
                notFoundComponent: NotFound,
            }));
        });
    };

    beforeEach(() => {
        const setLocation = (url: string) => {
            Object.defineProperty(window.location, 'href', {
                value   : url,
                writable: true,
            });

            const hashMatch = /#(.*)$/.exec(url);

            Object.defineProperty(window.location, 'hash', {
                value   : hashMatch ? hashMatch[0] : '',
                writable: true,
            });
        };

        Object.defineProperty(window, 'location', {
            value: {
                href   : startUrl,
                hash   : '',
                assign : vi.fn(),
                replace: vi.fn(),
                reload : vi.fn(),
            },
            writable: true,
        });

        window.history.pushState = vi.fn((state, _, url) => {
            Object.defineProperty(window.history, 'state', {
                value   : state,
                writable: true,
            });
            setLocation(String(url));
        });

        window.history.replaceState = vi.fn((state, _, url) => {
            Object.defineProperty(window.history, 'state', {
                value   : state,
                writable: true,
            });
            setLocation(String(url));
        });

        router = createHashRouter(createHashNavigation());
        container = document.createElement('div');

        document.body.append(container);
    });

    afterEach(() => {
        if(root) {
            const currentRoot = root;

            act(() => currentRoot.unmount());
            root = null;
        }
        document.body.replaceChildren();
        vi.clearAllMocks();
    });

    it('should render the home route on mount and switch on navigation', () => {
        renderRouter();

        expect(container.textContent).toContain('home');

        act(() => {
            router.navigate('about');
        });

        expect(container.textContent).toContain('about');
    });

    it('should render not-found for an unknown route', () => {
        renderRouter();

        act(() => {
            router.navigate('unknown');
        });

        expect(container.textContent).toContain('not-found');
    });

    it('should keep the shared navigation model across unmount and remount', () => {
        renderRouter();

        act(() => {
            router.navigate('about');
        });

        expect(container.textContent).toContain('about');

        // First page unmounts
        act(() => root!.unmount());
        root = null;

        // Second page mounts on the same shared router and reconciles
        renderRouter();

        expect(container.textContent).toContain('about');

        act(() => {
            router.goBack();
        });

        expect(container.textContent).toContain('home');
    });
});

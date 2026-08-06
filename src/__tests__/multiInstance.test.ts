/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HashNavigation, HashRouter } from '../types';

import { createHashNavigation } from '../core/hashNavigation';
import { createHashRouter } from '../core/hashRouter';

const startUrl = 'http://localhost:3000';

type HistoryMock = {
    stack   : Array<{ url: string; state: any; }>;
    position: number;
    baseUrl : string;
};

const createBrowserHistoryMock = (): HistoryMock => {
    const mock: HistoryMock = {
        stack   : [{ url: startUrl, state: {}, }],
        position: 0,
        baseUrl : startUrl,
    };

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

    const setHistoryState = (state: any) => {
        Object.defineProperty(window.history, 'state', {
            value   : state,
            writable: true,
        });
    };

    const dispatchHashChange = (oldURL: string, newURL: string) => {
        const event = new Event('hashchange');

        Object.defineProperties(event, {
            oldURL: { value: oldURL, },
            newURL: { value: newURL, },
        });

        window.dispatchEvent(event);
    };

    const go = (delta: number) => {
        const target = Math.min(Math.max(mock.position + delta, 0), mock.stack.length - 1);

        if(target === mock.position) {
            return;
        }

        const oldURL = mock.stack[mock.position].url;
        const entry = mock.stack[target];

        mock.position = target;
        setLocation(entry.url);
        setHistoryState(entry.state);
        dispatchHashChange(oldURL, entry.url);
    };

    window.history.pushState = vi.fn((state: any, _: string, url?: string | URL) => {
        const target = String(url);

        mock.stack = [...mock.stack.slice(0, mock.position + 1), { url: target, state, }];
        mock.position = mock.stack.length - 1;
        setLocation(target);
        setHistoryState(state);
    });

    window.history.replaceState = vi.fn((state: any, _: string, url?: string | URL) => {
        const target = String(url);

        mock.stack[mock.position] = { url: target, state, };
        setLocation(target);
        setHistoryState(state);
    });

    window.history.back = vi.fn(() => go(-1));
    window.history.forward = vi.fn(() => go(1));
    window.history.go = vi.fn((delta: number) => go(delta));

    return mock;
};

describe('multi-instance transitions', () => {
    let historyMock: HistoryMock;
    let sharedNav: HashNavigation;
    let routerA: HashRouter;
    let routerB: HashRouter;

    const createRouterA = () => createHashRouter(sharedNav);
    const createRouterB = () => createHashRouter(sharedNav);

    beforeEach(() => {
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

        historyMock = createBrowserHistoryMock();

        sharedNav = createHashNavigation();
        routerA = createRouterA();
        routerB = createRouterB();
    });

    afterEach(() => {
        try {
            routerA.destroy();
        }
        catch{
            // noop
        }
        try {
            routerB.destroy();
        }
        catch{
            // noop
        }
        vi.clearAllMocks();
    });

    it('should keep the shared history consistent when navigating A -> B and back', () => {
        const onChangeA = vi.fn();
        const onChangeB = vi.fn();

        // Page A is mounted with its own route group
        routerA.create({
            onChange: onChangeA,
            config  : {
                homeUrl   : 'a-home',
                routeNames: ['a-home', 'a1', 'a2'],
            },
        });
        routerA.navigate('a1');
        routerA.navigate('a2');

        // Transition to page B
        routerA.navigate('b-home');
        routerA.destroy();

        // Page B is mounted with another route group
        routerB.create({
            onChange: onChangeB,
            config  : {
                homeUrl   : 'b-home',
                routeNames: ['b-home', 'b1', 'b2'],
            },
        });
        routerB.navigate('b1');
        routerB.navigate('b2');

        expect(sharedNav.currentEntry.value.hash).toBe('b2');
        expect(sharedNav.canGoBack.value).toBe(true);

        // Go back across the group boundary into page A territory
        for(let i = 0; i < historyMock.stack.length; i++) {
            window.history.back();
        }

        expect(sharedNav.currentEntry.value.hash).toBe('a-home');
        expect(sharedNav.canGoBack.value).toBe(false);

        // And forward again into page B territory
        for(let i = 0; i < historyMock.stack.length; i++) {
            window.history.forward();
        }

        expect(sharedNav.currentEntry.value.hash).toBe('b2');
        expect(sharedNav.canGoForward.value).toBe(false);

        // The model must not contain duplicated or inverted entries
        const hashes = sharedNav.entries.value.map((entry) => entry.hash);

        expect(hashes).toEqual(['a-home', 'a1', 'a2', 'b-home', 'b1', 'b2']);
        expect(new Set(hashes).size).toBe(hashes.length);

        // Go back to page A and remount it: the shared model must reconcile
        window.history.back();
        window.history.back();
        window.history.back();

        expect(sharedNav.currentEntry.value.hash).toBe('a2');

        routerB.destroy();

        routerA.create({
            onChange: onChangeA,
            config  : {
                homeUrl   : 'a-home',
                routeNames: ['a-home', 'a1', 'a2'],
            },
        });

        expect(sharedNav.currentEntry.value.hash).toBe('a2');
        expect(sharedNav.canGoBack.value).toBe(true);
        expect(sharedNav.prevEntry.value?.hash).toBe('a1');
        expect(sharedNav.canGoForward.value).toBe(true);
    });

    it('should not break a second instance when the first one is destroyed', () => {
        const onChangeA = vi.fn();
        const onChangeB = vi.fn();

        routerA.create({
            onChange: onChangeA,
            config  : {
                homeUrl   : 'a1',
                routeNames: ['a1', 'a2'],
            },
        });
        routerA.navigate('a2');

        // Page B mounts while page A is still alive
        routerB.create({
            onChange: onChangeB,
            config  : {
                homeUrl   : 'b1',
                routeNames: ['b1', 'b2'],
            },
        });

        expect(sharedNav.currentEntry.value.hash).toBe('b1');
        expect(sharedNav.canGoBack.value).toBe(true);

        // Destroying page A must not reset the shared model or kill page B
        routerA.destroy();

        expect(sharedNav.currentEntry.value.hash).toBe('b1');
        expect(sharedNav.entries.value.length).toBe(2);
        expect(sharedNav.canGoBack.value).toBe(true);

        onChangeB.mockClear();

        routerB.navigate('b2');

        expect(onChangeB).toHaveBeenCalledTimes(1);
        expect(onChangeB).toHaveBeenLastCalledWith(
            expect.objectContaining({ hash: 'b2', }),
            expect.anything(),
            'success'
        );
        expect(sharedNav.canGoBack.value).toBe(true);
    });

    it('should splice forward entries on navigate after a cross-group back', () => {
        const onChangeB = vi.fn();

        routerA.create({
            onChange: vi.fn(),
            config  : {
                homeUrl   : 'a-home',
                routeNames: ['a-home', 'a1', 'a2'],
            },
        });
        routerA.navigate('a1');
        routerA.navigate('a2');

        // Transition to page B
        routerA.navigate('b1');
        routerA.destroy();

        routerB.create({
            onChange: onChangeB,
            config  : {
                homeUrl   : 'b1',
                routeNames: ['b1', 'b2'],
            },
        });
        routerB.navigate('b2');

        // Go back two steps: into page A territory
        window.history.back();
        window.history.back();

        expect(sharedNav.currentEntry.value.hash).toBe('a2');

        // Navigate again from a non-current position: forward entries must be cut
        routerB.navigate('b3');

        expect(sharedNav.entries.value.map((entry) => entry.hash)).toEqual(['a-home', 'a1', 'a2', 'b3']);
        expect(sharedNav.currentEntry.value.hash).toBe('b3');
        expect(sharedNav.canGoForward.value).toBe(false);

        // Browser history must match the model
        expect(historyMock.stack.map((entry) => entry.url)).toEqual([
            'http://localhost:3000/#/a-home',
            'http://localhost:3000/#/a1',
            'http://localhost:3000/#/a2',
            'http://localhost:3000/#/b3'
        ]);
        expect(historyMock.position).toBe(historyMock.stack.length - 1);
    });
});

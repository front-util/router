import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createHashNavigation } from '../core/hashNavigation';
import { createHashRouter } from '../core/hashRouter';

/**
 * happy-dom keeps history state always null even after pushState, so tests
 * that rely on the browser persisting history.state need this thin wrapper:
 * the real URL bookkeeping stays, only the state is tracked.
 */
const installHistoryStateMock = () => {
    const originalPush = window.history.pushState.bind(window.history);
    const originalReplace = window.history.replaceState.bind(window.history);
    let state: unknown = null;

    vi.spyOn(window.history, 'pushState').mockImplementation((data, unused, url) => {
        state = data === undefined ? null : data;

        return originalPush(data, unused, url);
    });
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, url) => {
        state = data === undefined ? null : data;

        return originalReplace(data, unused, url);
    });
    Object.defineProperty(window.history, 'state', {
        configurable: true,
        get         : () => state,
    });
};

describe('hashNavigation/navigate', () => {
    it('should not create a duplicate entry for the same hash expressed differently', () => {
        const nav = createHashNavigation();
        const initialCount = nav.entries.value.length;

        nav.navigate('/users/ivan%20petrov');
        expect(nav.entries.value.length).toBe(initialCount + 1);

        nav.navigate('/users/ivan petrov');
        expect(nav.entries.value.length).toBe(initialCount + 1);

        nav.navigate('users/ivan petrov');
        expect(nav.entries.value.length).toBe(initialCount + 1);

        nav.navigate('/users/ivan%20petrov/');
        expect(nav.entries.value.length).toBe(initialCount + 1);
    });

    it('should push a new entry when the hash actually changes', () => {
        const nav = createHashNavigation();
        const initialCount = nav.entries.value.length;

        nav.navigate('/about');
        expect(nav.entries.value.length).toBe(initialCount + 1);

        nav.navigate('/users/42');
        expect(nav.entries.value.length).toBe(initialCount + 2);
    });

    it('should update state without pushing a new entry for an unchanged hash', () => {
        const nav = createHashNavigation();

        nav.navigate('/about', { state: { tab: 'profile', }, });
        const count = nav.entries.value.length;

        nav.navigate('/about', { state: { tab: 'settings', }, });

        expect(nav.entries.value.length).toBe(count);
        expect(nav.currentEntry.value.state).toEqual({ tab: 'settings', });
    });

    it('should keep the current URL when navigating to the same hash with new state', () => {
        const nav = createHashNavigation();

        nav.navigate('/settings');
        const url = nav.currentEntry.value.url;

        nav.navigate('/settings/', { state: { theme: 'dark', }, });

        expect(nav.currentEntry.value.url).toBe(url);
        expect(nav.currentEntry.value.state).toEqual({ theme: 'dark', });
    });
});

describe('hashNavigation/state across a page reload', () => {
    beforeEach(() => {
        installHistoryStateMock();
    });

    it('restores the entry state from the native history.state after a reload', () => {
        // First lifecycle: navigate with state, the browser keeps it natively
        const nav = createHashNavigation();

        nav.create();
        nav.navigate('/about', { state: { tab: 'profile', }, });

        expect(window.history.state).toEqual({ tab: 'profile', });

        nav.destroy();

        // A reload rebuilds every model from scratch: the fresh instance must
        // pick the state up from window.history.state instead of starting
        // with an empty one
        const reloaded = createHashNavigation();

        reloaded.create();

        expect(reloaded.currentEntry.value.state).toEqual({ tab: 'profile', });
        expect(window.history.state).toEqual({ tab: 'profile', });

        reloaded.destroy();
    });

    it('updateCurrentEntry without options must not wipe the native state', () => {
        const nav = createHashNavigation();

        nav.create();
        nav.navigate('/about', { state: { tab: 'profile', }, });

        const url = nav.currentEntry.value.url;

        nav.updateCurrentEntry();

        expect(window.history.state).toEqual({ tab: 'profile', });
        expect(nav.currentEntry.value.state).toEqual({ tab: 'profile', });
        expect(nav.currentEntry.value.url).toBe(url);

        nav.destroy();
    });

    it('replacing the hash without a new state keeps the native state', () => {
        const nav = createHashNavigation();

        nav.create();
        nav.navigate('/about', { state: { tab: 'profile', }, });

        nav.updateCurrentEntryHash('home');

        expect(window.history.state).toEqual({ tab: 'profile', });
        expect(nav.currentEntry.value.state).toEqual({ tab: 'profile', });
        expect(nav.currentEntry.value.hash).toBe('home');

        nav.destroy();
    });

    it('keeps the native state when a redirect to home follows an unknown deep link', () => {
        window.location.hash = '#/unknown';

        const nav = createHashNavigation();

        nav.create();
        nav.navigate('/unknown', { state: { tab: 'profile', }, });

        expect(window.history.state).toEqual({ tab: 'profile', });

        nav.destroy();

        // A reload on '#/unknown' boots on an unconfigured hash, so the
        // router redirects to home: this replace must not discard the state
        // the browser restored for the unknown entry
        const reloaded = createHashNavigation();
        const router = createHashRouter(reloaded);

        router.create({
            config  : { homeUrl: 'home', routeNames: ['home'], },
            onChange: () => {},
        });

        expect(router.getHash()).toBe('home');
        expect(router.currentEntry.value.state).toEqual({ tab: 'profile', });
        expect(window.history.state).toEqual({ tab: 'profile', });

        router.destroy();
    });
});

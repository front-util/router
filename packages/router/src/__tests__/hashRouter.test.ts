import { describe, expect, it } from 'vitest';

import { createHashNavigation } from '../core/hashNavigation';
import { createHashRouter } from '../core/hashRouter';

/**
 * Simulates a full page load at a URL carrying the given hash — the URL is
 * rewritten before any router/navigation instance is built.
 */
const loadAt = (hash: string) => {
    window.location.hash = `#/${hash.replace(/^\/+/, '')}`;
};

describe('hashRouter/subscribe navigation status', () => {
    it('reports notStarted before the config is applied and success afterwards', () => {
        loadAt('about');
        const nav = createHashNavigation();
        const router = createHashRouter(nav);
        const calls: string[] = [];

        const unsubscribe = router.subscribe((_entry, _prev, navigationStatus) => {
            calls.push(navigationStatus);
        });

        router.create({
            config  : { homeUrl: 'about', routeNames: ['about', 'users/:userId'], },
            onChange: () => {},
        });

        expect(calls).toEqual(['notStarted', 'success']);
        unsubscribe();
    });

    it('does not double-emit when a config change keeps the same entry', () => {
        loadAt('about');
        const nav = createHashNavigation();
        const router = createHashRouter(nav);
        const calls: string[] = [];

        router.create({
            config  : { homeUrl: 'about', routeNames: ['about', 'users/:userId'], },
            onChange: () => {},
        });

        const unsubscribe = router.subscribe((_entry, _prev, navigationStatus) => {
            calls.push(navigationStatus);
        });

        router.create({
            config  : { homeUrl: 'about', routeNames: ['about'], },
            onChange: () => {},
        });

        expect(calls).toEqual(['success']);
        unsubscribe();
    });

    it('lets consumers call router API methods during transitions including the first one', () => {
        loadAt('about');
        const nav = createHashNavigation();
        const router = createHashRouter(nav);

        type Record = { status: string; hash: string; getHash: string; hasPage: boolean; canGoBack: boolean; };
        const records: Record[] = [];

        const unsubscribe = router.subscribe((entry, _prev, navigationStatus) => {
            records.push({
                status   : navigationStatus,
                hash     : entry.hash,
                getHash  : router.getHash(),
                hasPage  : router.hasPage(entry.hash),
                canGoBack: router.canGoBack.value,
            });
        });

        // First transition — the router is not configured yet
        expect(records).toEqual([{
            status   : 'notStarted',
            hash     : 'about',
            getHash  : 'about',
            hasPage  : false,
            canGoBack: false,
        }]);

        // After the second transition (config applied) the status becomes success
        router.create({
            config  : { homeUrl: 'about', routeNames: ['about'], },
            onChange: () => {},
        });

        expect(records[1]).toMatchObject({
            status : 'success',
            hash   : 'about',
            getHash: 'about',
            hasPage: true,
        });

        // A later transition to an unconfigured route reports notfound
        router.navigate('users/1');

        expect(records[records.length - 1]).toMatchObject({
            status   : 'notfound',
            hash     : 'users/1',
            getHash  : 'users/1',
            hasPage  : false,
            canGoBack: true,
        });

        unsubscribe();
    });

    it('redirects an unknown first-launch hash and reports success for the home route', () => {
        loadAt('nope');
        const nav = createHashNavigation();
        const router = createHashRouter(nav);
        const calls: string[] = [];

        const unsubscribe = router.subscribe((_entry, _prev, navigationStatus) => {
            calls.push(navigationStatus);
        });

        router.create({
            config  : { homeUrl: 'home', routeNames: ['home'], },
            onChange: () => {},
        });

        expect(router.getHash()).toBe('home');
        expect(calls).toEqual(['notStarted', 'success']);
        unsubscribe();
    });

    it('reports notfound for a missing route once the router is configured', () => {
        loadAt('about');
        const nav = createHashNavigation();
        const router = createHashRouter(nav);
        const calls: string[] = [];

        const unsubscribe = router.subscribe((entry, _prev, navigationStatus) => {
            calls.push(`${entry.hash}:${navigationStatus}`);
        });

        router.create({
            config  : { homeUrl: 'about', routeNames: ['about', 'users/:userId'], },
            onChange: () => {},
        });
        router.navigate('users/42');

        expect(calls).toEqual([
            'about:notStarted',
            'about:success',
            'users/42:success'
        ]);
        unsubscribe();
    });
});

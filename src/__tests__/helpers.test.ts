/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { 
    getHash, 
    createHistoryEntry, 
    createNavigationResult, 
    isRouteMatch, 
    getRouteItem, 
    getParamsFromUrl 
} from '#src/helpers';
import type { NavigationHistoryEntry, NavigationState } from '#src/types';

describe('helpers/getHash', () => {
    it('should extract hash from URL', () => {
        expect(getHash('https://example.com#section')).toBe('section');
        expect(getHash('https://example.com#/users')).toBe('users');
        expect(getHash('https://example.com/path#/dashboard')).toBe('dashboard');
    });

    it('should return "/" for URLs without hash', () => {
        expect(getHash('https://example.com')).toBe('/');
        expect(getHash('https://example.com/path')).toBe('/');
    });

    it('should handle empty hash values', () => {
        expect(getHash('https://example.com#')).toBe('/');
    });

    it('should handle various hash formats', () => {
        expect(getHash('https://example.com#section?query=param')).toBe('section?query=param');
        expect(getHash('https://example.com#/path/to/resource')).toBe('path/to/resource');
        expect(getHash('https://example.com/base/path#/relative/path')).toBe('relative/path');
    });

    it('should handle URL objects', () => {
        expect(getHash(new URL('https://example.com#section').href)).toBe('section');
    });
});

describe('helpers/createHistoryEntry', () => {
    it('should create a history entry with the correct structure', () => {
        const url = 'https://example.com/path';
        const entry = createHistoryEntry(url);

        expect(entry).toEqual({
            url,
            key         : expect.any(String),
            id          : expect.any(String),
            index       : 0,
            sameDocument: true,
            state       : undefined,
            getState    : expect.any(Function),
            getHash     : expect.any(Function),
        });
    });

    it('should set the state correctly', () => {
        const url = 'https://example.com/path';
        const state: NavigationState = { foo: 'bar', count: 123, };
        const entry = createHistoryEntry(url, state);

        expect(entry.state).toEqual(state);
        expect(entry.getState()).toEqual(state);
    });

    it('should set the index correctly', () => {
        const url = 'https://example.com/path';
        const entry = createHistoryEntry(url, undefined, 5);

        expect(entry.index).toBe(5);
    });

    it('should generate unique keys and IDs', () => {
        const entries = Array.from({ length: 10, }, () => createHistoryEntry('https://example.com'));
    
        // Check if all keys are unique
        const keys = entries.map((entry) => entry.key);
        const uniqueKeys = new Set(keys);

        expect(uniqueKeys.size).toBe(entries.length);
    
        // Check if all IDs are unique
        const ids = entries.map((entry) => entry.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(entries.length);
    });

    it('should create an entry with getState method that returns the state', () => {
        const state = { data: 'test-data', };
        const entry = createHistoryEntry('https://example.com', state);
    
        expect(entry.getState()).toBe(state);
    
        // Test that getState is bound to the entry
        const { getState, } = entry;

        expect(getState()).toBe(state);
    });
});

describe('helpers/createNavigationResult', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should create a navigation result with committed and finished promises', () => {
        const entry: NavigationHistoryEntry = createHistoryEntry('https://example.com');
        const result = createNavigationResult(entry);

        expect(result).toEqual({
            committed: expect.any(Promise),
            finished : expect.any(Promise),
        });
    });

    it('should resolve committed promise immediately (on next tick)', async () => {
        const entry = createHistoryEntry('https://example.com');
        const result = createNavigationResult(entry);

        let committedResolved = false;

        result.committed.then(() => {
            committedResolved = true;
        });

        // Promise should not be resolved yet
        expect(committedResolved).toBe(false);

        // Advance timers to simulate next tick
        await vi.advanceTimersByTimeAsync(0);

        // Now the promise should be resolved
        expect(committedResolved).toBe(true);
    });

    it('should resolve finished promise after committed', async () => {
        const entry = createHistoryEntry('https://example.com');
        const result = createNavigationResult(entry);

        let committedResolved = false;
        let finishedResolved = false;

        result.committed.then(() => {
            committedResolved = true;
        });

        result.finished.then(() => {
            finishedResolved = true;
        });

        // Advance timers just for the committed promise
        await vi.advanceTimersByTimeAsync(0);

        // Committed should be resolved, but not finished
        expect(committedResolved).toBe(true);
        expect(finishedResolved).toBe(false);

        // Advance timers for the finished promise
        await vi.advanceTimersByTimeAsync(10);

        // Now both should be resolved
        expect(committedResolved).toBe(true);
        expect(finishedResolved).toBe(true);
    });

    it('should handle chaining promises correctly', async () => {
        const entry = createHistoryEntry('https://example.com');
        const result = createNavigationResult(entry);

        let transformedCommitted: string | null = null;
        let transformedFinished: string | null = null;
         
        result.committed
            .then((e) => `Committed: ${e.url}`)
            .then((value) => { transformedCommitted = value; });

        result.finished
            .then((e) => `Finished: ${e.url}`)
            .then((value) => { transformedFinished = value; });

        // Advance timers to resolve both promises
        await vi.advanceTimersByTimeAsync(10);

        expect(transformedCommitted).toBe('Committed: https://example.com');
        expect(transformedFinished).toBe('Finished: https://example.com');
    });
});

describe('helpers/isRouteMatch', () => {
    it('should match simple routes', () => {
        expect(isRouteMatch('/users', '/users')).toBe(true);
        expect(isRouteMatch('/dashboard', '/dashboard')).toBe(true);
        expect(isRouteMatch('/', '/')).toBe(true);
    });

    it('should handle route parameters', () => {
        expect(isRouteMatch('/users/:id', '/users/123')).toBe(true);
        expect(isRouteMatch('/posts/:id', '/posts/456')).toBe(true);
        expect(isRouteMatch('/products/:id', '/products/789')).toBe(true);
    });

    it('should handle negative numbers in parameters', () => {
        expect(isRouteMatch('/temperature/:value', '/temperature/-10')).toBe(true);
        expect(isRouteMatch('/position/:coord', '/position/-42')).toBe(true);
    });

    it('should return false for non-matching routes', () => {
        expect(isRouteMatch('/users', '/posts')).toBe(false);
        expect(isRouteMatch('/dashboard', '/settings')).toBe(false);
    });

    it('should handle null or undefined hash', () => {
        expect(isRouteMatch('/home', null as unknown as string)).toBe(false);
        expect(isRouteMatch('/home', undefined as unknown as string)).toBe(false);
    });

    it('should handle different route segment lengths', () => {
        expect(isRouteMatch('/users/:id', '/users/123/settings')).toBe(false);
        expect(isRouteMatch('/users/:id/settings', '/users/123')).toBe(false);
    });
});

describe('helpers/getRouteItem', () => {
    it('should return the corresponding route item for exact matches', () => {
        const routes = {
            '/'         : 'home',
            '/users'    : 'users',
            '/dashboard': 'dashboard',
        };

        expect(getRouteItem(routes, '/')).toBe('home');
        expect(getRouteItem(routes, '/users')).toBe('users');
        expect(getRouteItem(routes, '/dashboard')).toBe('dashboard');
    });

    it('should return the corresponding route item for parameterized routes', () => {
        const routes = {
            '/users'    : 'users-list',
            '/users/:id': 'user-details',
            '/posts/:id': 'post-details',
        };

        expect(getRouteItem(routes, '/users')).toBe('users-list');
        expect(getRouteItem(routes, '/users/123')).toBe('user-details');
        expect(getRouteItem(routes, '/posts/456')).toBe('post-details');
    });

    it('should return undefined for routes that do not match', () => {
        const routes = {
            '/'         : 'home',
            '/users'    : 'users',
            '/dashboard': 'dashboard',
        };

        expect(getRouteItem(routes, '/settings')).toBeUndefined();
        expect(getRouteItem(routes, '/products')).toBeUndefined();
    });

    it('should work with complex objects as route values', () => {
        const routes = {
            '/'         : { component: 'Home', title: 'Home Page', },
            '/users'    : { component: 'UsersList', title: 'Users', },
            '/users/:id': { component: 'UserDetails', title: 'User Details', },
        };

        expect(getRouteItem(routes, '/')).toEqual({ component: 'Home', title: 'Home Page', });
        expect(getRouteItem(routes, '/users')).toEqual({ component: 'UsersList', title: 'Users', });
        expect(getRouteItem(routes, '/users/123')).toEqual({ component: 'UserDetails', title: 'User Details', });
    });

    it('should handle empty route maps', () => {
        const routes = {};

        expect(getRouteItem(routes, '/any-route')).toBeUndefined();
    });
});

describe('helpers/getParamsFromUrl', () => {
    it('should extract parameter values from URL', () => {
        expect(getParamsFromUrl('/users/:id', '/users/123')).toEqual({ id: '123', });
        expect(getParamsFromUrl('/posts/:postId', '/posts/456')).toEqual({ postId: '456', });
        expect(getParamsFromUrl('/products/:category/:id', '/products/electronics/789')).toEqual({
            category: 'electronics',
            id      : '789',
        });
    });

    it('should handle negative numbers as parameter values', () => {
        expect(getParamsFromUrl('/temperature/:value', '/temperature/-10')).toEqual({ value: '-10', });
        expect(getParamsFromUrl('/position/:coord', '/position/-42')).toEqual({ coord: '-42', });
    });

    it('should handle routes with no parameters', () => {
        expect(getParamsFromUrl('/users', '/users')).toEqual({});
        expect(getParamsFromUrl('/dashboard', '/dashboard')).toEqual({});
        expect(getParamsFromUrl('/', '/')).toEqual({});
    });

    it('should return empty object when segment count does not match', () => {
        expect(getParamsFromUrl('/users/:id', '/users')).toEqual({});
        expect(getParamsFromUrl('/users', '/users/123')).toEqual({});
        expect(getParamsFromUrl('/products/:id', '/products/123/details')).toEqual({});
    });

    it('should handle multiple parameters', () => {
        expect(getParamsFromUrl('/users/:userId/posts/:postId', '/users/123/posts/456')).toEqual({
            userId: '123',
            postId: '456',
        });
    });

    it('should handle parameters with non-numeric values', () => {
        expect(getParamsFromUrl('/categories/:name', '/categories/electronics')).toEqual({
            name: 'electronics',
        });
        expect(getParamsFromUrl('/users/:username', '/users/john-doe')).toEqual({
            username: 'john-doe',
        });
    });

    it('should handle mixed static and parametrized segments', () => {
        expect(getParamsFromUrl('/users/:id/profile', '/users/123/profile')).toEqual({
            id: '123',
        });
        expect(getParamsFromUrl('/repos/:owner/:repo/issues', '/repos/facebook/react/issues')).toEqual({
            owner: 'facebook',
            repo : 'react',
        });
    });
});
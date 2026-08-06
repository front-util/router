import { describe, expect, it } from 'vitest';

import type { NavigationState } from '../types';

import {
    createHash,
    createHistoryEntry,
    getHash,
    getParamsFromUrl,
    getRouteItem,
    getUrlFromPattern,
    isRouteMatch,
    parseQueryParams
} from '../helpers';

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

describe('helpers/createHash', () => {
    it('should keep an already normalized hash unchanged', () => {
        expect(createHash('about')).toBe('/about');
        expect(createHash('profile/100')).toBe('/profile/100');
    });

    it('should strip leading slash and hash mark', () => {
        expect(createHash('/about')).toBe('/about');
        expect(createHash('#/about')).toBe('/about');
        expect(createHash('#about')).toBe('/about');
        expect(createHash('#//about')).toBe('/about');
    });

    it('should strip trailing slash', () => {
        expect(createHash('about/')).toBe('/about');
        expect(createHash('/about/')).toBe('/about');
    });

    it('should handle empty hash', () => {
        expect(createHash('')).toBe('/');
        expect(createHash('/')).toBe('/');
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
            state       : {},
            hash        : '/',
        });
    });

    it('should set the state correctly', () => {
        const url = 'https://example.com/path';
        const state: NavigationState = { foo: 'bar', count: 123, };
        const entry = createHistoryEntry(url, state);

        expect(entry.state).toEqual(state);
        expect(entry.state).toEqual(state);
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

        expect(entry.state).toBe(state);
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
        expect(isRouteMatch('/home', null)).toBe(false);
        expect(isRouteMatch('/home', undefined as unknown as string)).toBe(false);
    });

    it('should handle different route segment lengths', () => {
        expect(isRouteMatch('/users/:id', '/users/123/settings')).toBe(false);
        expect(isRouteMatch('/users/:id/settings', '/users/123')).toBe(false);
    });

    it('should handle route with query params', () => {
        expect(isRouteMatch('/dashboard', '/dashboard?query1=test')).toBe(true);
        expect(isRouteMatch('/dashboard', '/dashboard#query1=test')).toBe(false);
    });

    it('should escape regex special characters in static segments', () => {
        expect(isRouteMatch('v1.list/:id', 'v1.list/1')).toBe(true);
        expect(isRouteMatch('v1.list/:id', 'v1Xlist/1')).toBe(false);
        expect(isRouteMatch('v1.list/:id', 'v1.list/1/extra')).toBe(false);
        expect(isRouteMatch('users+extra/:id', 'users+extra/1')).toBe(true);
        expect(isRouteMatch('users+extra/:id', 'usersXextra/1')).toBe(false);
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

describe('helpers/parseQueryParams', () => {
    it('should parse simple query params', () => {
        expect(parseQueryParams('profile?param1=test1&param2=test2')).toEqual({ param1: 'test1', param2: 'test2', });
    });

    it('should keep "=" inside values', () => {
        expect(parseQueryParams('profile?a=b=c')).toEqual({ a: 'b=c', });
        expect(parseQueryParams('profile?url=http://x?y=1')).toEqual({ url: 'http://x?y=1', });
    });

    it('should decode keys and values', () => {
        expect(parseQueryParams('profile?q=1%202&key%20with%20space=value')).toEqual({ 'q': '1 2', 'key with space': 'value', });
    });

    it('should handle params without value', () => {
        expect(parseQueryParams('profile?flag&a=1')).toEqual({ flag: '', a: '1', });
    });

    it('should return empty object without query', () => {
        expect(parseQueryParams('profile')).toEqual({});
    });

    it('should not throw on malformed percent-encoding', () => {
        expect(() => parseQueryParams('profile?q=%zz%')).not.toThrow();
        expect(parseQueryParams('profile?q=%zz%')).toEqual({ q: '%zz%', });
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

    it('should handle parameters with query params', () => {
        expect(getParamsFromUrl('/categories/:name', '/categories/electronics?testQuery=test')).toEqual({
            name: 'electronics',
        });
    });

    it('should decode parameter values', () => {
        expect(getParamsFromUrl('/users/:name', '/users/%D0%B0%D0%BB%D0%B5%D0%BA%D1%81')).toEqual({
            name: 'алекс',
        });
        expect(getParamsFromUrl('/users/:name', '/users/ivan%20petrov')).toEqual({
            name: 'ivan petrov',
        });
    });

    it('should not throw on malformed percent-encoding', () => {
        expect(() => getParamsFromUrl('/users/:name', '/users/%zz')).not.toThrow();
        expect(getParamsFromUrl('/users/:name', '/users/%zz')).toEqual({
            name: '%zz',
        });
    });
});

describe('helpers/getUrlFromPattern', () => {
    it('should substitute params into the pattern', () => {
        expect(getUrlFromPattern('/user/:category/:id', { category: 5, id: 10, })).toBe('/user/5/10');
    });

    it('should substitute string and number values', () => {
        expect(getUrlFromPattern('/users/:name/posts/:postId', { name: 'john', postId: 42, })).toBe('/users/john/posts/42');
    });

    it('should substitute params in patterns without leading slash', () => {
        expect(getUrlFromPattern('user/:id', { id: 7, })).toBe('user/7');
    });

    it('should substitute params in the middle and end segments', () => {
        expect(getUrlFromPattern('/repos/:owner/:repo/issues', { owner: 'facebook', repo: 'react', })).toBe('/repos/facebook/react/issues');
    });

    it('should keep the placeholder for missing params', () => {
        expect(getUrlFromPattern('/user/:category/:id', { category: 5, })).toBe('/user/5/:id');
    });

    it('should ignore extra params not present in the pattern', () => {
        expect(getUrlFromPattern('/user/:id', { id: 10, extra: 1, })).toBe('/user/10');
    });

    it('should leave the pattern unchanged when no params are provided', () => {
        expect(getUrlFromPattern('/user/:id')).toBe('/user/:id');
        expect(getUrlFromPattern('/about')).toBe('/about');
    });

    it('should preserve query params in the pattern', () => {
        expect(getUrlFromPattern('/user/:id?tab=settings', { id: 5, })).toBe('/user/5?tab=settings');
    });

    it('should not substitute params in non-parameter segments', () => {
        expect(getUrlFromPattern('/repos/:owner/repo/issues', { owner: 'facebook', })).toBe('/repos/facebook/repo/issues');
    });
});

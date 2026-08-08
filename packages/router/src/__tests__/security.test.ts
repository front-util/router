import { describe, expect, it } from 'vitest';

import { createHashNavigation } from '../core/hashNavigation';
import { createHashRouter } from '../core/hashRouter';
import {
    createHash,
    getHash,
    getParamsFromUrl,
    getUrlFromPattern,
    isRouteMatch,
    parseQueryParams
} from '../helpers';

const XSS_PAYLOADS = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    '\'><svg onload=alert(1)>',
    '"><script>document.body.innerHTML="pwned"</script>',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>'
] as const;

// Payloads that do not contain "/" so they stay inside a single route segment
const SINGLE_SEGMENT_PAYLOADS = [
    '"><img src=x onerror=alert(1)>',
    '\'><svg onload=alert(1)>',
    'javascript:alert(1)',
    '<svg onload=alert(1)>'
] as const;

describe('security/getHash', () => {
    it('should keep HTML characters percent-encoded in the extracted hash', () => {
        expect(getHash('https://example.com#/users/<script>alert(1)</script>')).toBe(
            'users/%3Cscript%3Ealert(1)%3C/script%3E'
        );
        expect(getHash('https://example.com#/p?q="><img src=x onerror=alert(1)>')).toBe(
            'p?q=%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E'
        );
    });

    it('should not throw and return "/" for malformed or non-absolute input', () => {
        for(const input of ['', 'not a url', '////', 'https://', 'javascript:']) {
            expect(() => getHash(input), `input: ${JSON.stringify(input)}`).not.toThrow();
            expect(typeof getHash(input)).toBe('string');
        }
        expect(getHash('not a url')).toBe('/');
        expect(getHash('')).toBe('/');
    });

    it('should resolve relative fragments against the current location', () => {
        expect(getHash('#/users')).toBe('users');
        expect(getHash('/users/123')).toBe('/');
    });

    it('should keep foreign-scheme hashes inside the fragment', () => {
        expect(getHash('javascript:alert(1)#/x')).toBe('x');
        expect(getHash('data:text/html,<script>alert(1)</script>#/x')).toBe('x');
    });
});

describe('security/createHash', () => {
    it('should keep XSS payloads as plain data without crashing', () => {
        for(const payload of XSS_PAYLOADS) {
            const hash = createHash(payload);

            expect(hash).toMatch(/^\//);
        }
    });

    it('should keep control characters as plain data', () => {
        expect(createHash('a\r\nb')).toBe('/a\r\nb');
        expect(createHash('a\tb')).toBe('/a\tb');
        expect(createHash('\r\n')).toBe('/\r\n');
    });

    it('should keep HTML payloads unencoded (encoding happens on URL construction)', () => {
        expect(createHash('<script>alert(1)</script>')).toBe('/<script>alert(1)</script>');
    });
});

describe('security/parseQueryParams', () => {
    it('should decode XSS payloads exactly once', () => {
        expect(parseQueryParams('p?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E')).toEqual({
            q: '<script>alert(1)</script>',
        });
        expect(parseQueryParams('p?q=%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E')).toEqual({
            q: '"><img src=x onerror=alert(1)>',
        });
    });

    it('should not double-decode already-encoded payloads', () => {
        expect(parseQueryParams('p?q=%253Cscript%253E')).toEqual({ q: '%3Cscript%3E', });
    });

    it('should keep values literal when no valid encoding is present', () => {
        expect(parseQueryParams('p?q=<script>alert(1)</script>')).toEqual({
            q: '<script>alert(1)</script>',
        });
    });

    it('should not throw on malformed percent-encoding', () => {
        expect(() => parseQueryParams('p?q=%zz%&a=1')).not.toThrow();
        expect(parseQueryParams('p?q=%zz%')).toEqual({ q: '%zz%', });
    });

    it('should not pollute Object.prototype via __proto__/constructor/prototype keys', () => {
        const protoBefore = Object.getPrototypeOf({});
        const result = parseQueryParams('p?__proto__=polluted&constructor=evil&prototype=pwned');

        expect(Object.getPrototypeOf({})).toBe(protoBefore);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(({} as Record<string, unknown>).evil).toBeUndefined();
        expect(Object.getOwnPropertyDescriptor(result, '__proto__')).toBeUndefined();
        expect(Object.keys(result)).toHaveLength(2);
        expect(result.constructor).toBe('evil');
        expect(result.prototype).toBe('pwned');
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
});

describe('security/getParamsFromUrl', () => {
    it('should decode XSS payloads exactly once', () => {
        expect(getParamsFromUrl('/users/:id', '/users/%3Cscript%3Ealert(1)%3C%2Fscript%3E')).toEqual({
            id: '<script>alert(1)</script>',
        });
        expect(getParamsFromUrl('/users/:id', '/users/%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E')).toEqual({
            id: '"><img src=x onerror=alert(1)>',
        });
    });

    it('should not double-decode already-encoded payloads', () => {
        expect(getParamsFromUrl('/users/:id', '/users/%253Cscript%253E')).toEqual({
            id: '%3Cscript%3E',
        });
    });

    it('should keep an encoded slash as part of a single parameter value', () => {
        expect(getParamsFromUrl('/users/:id', '/users/%2Fetc%2Fpasswd')).toEqual({
            id: '/etc/passwd',
        });
    });

    it('should not throw on malformed percent-encoding', () => {
        expect(() => getParamsFromUrl('/users/:id', '/users/%zz')).not.toThrow();
        expect(getParamsFromUrl('/users/:id', '/users/%zz')).toEqual({ id: '%zz', });
    });

    it('should not pollute Object.prototype via a parameter named __proto__', () => {
        const protoBefore = Object.getPrototypeOf({});
        const result = getParamsFromUrl('/user/:__proto__', '/user/x');

        expect(Object.getPrototypeOf({})).toBe(protoBefore);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(Object.keys(result)).toEqual([]);
    });
});

describe('security/getUrlFromPattern', () => {
    it('should insert values verbatim without HTML escaping', () => {
        expect(getUrlFromPattern('/users/:id', { id: '<script>alert(1)</script>', })).toBe(
            '/users/<script>alert(1)</script>'
        );
        expect(getUrlFromPattern('/users/:id', { id: 'javascript:alert(1)', })).toBe(
            '/users/javascript:alert(1)'
        );
    });
});

describe('security/isRouteMatch', () => {
    it('should treat single-segment XSS payloads in the hash as plain data, never as regex', () => {
        for(const payload of SINGLE_SEGMENT_PAYLOADS) {
            expect(isRouteMatch('/users/:id', `/users/${payload}`)).toBe(true);
        }
    });

    it('should treat a "/" inside a payload as a route boundary, not as data', () => {
        expect(isRouteMatch('/users/:id', '/users/<script>alert(1)</script>')).toBe(false);
        expect(isRouteMatch('/users/:id', '/users/a/b')).toBe(false);
        expect(isRouteMatch('/users/:id', '/users/%3Cscript%3Ealert(1)%3C%2Fscript%3E')).toBe(true);
    });

    it('should match payloads containing regex metacharacters', () => {
        expect(isRouteMatch('/users/:id', '/users/a(b+c)*[d].e')).toBe(true);
        expect(isRouteMatch('/users/:id', '/users/a^$|\\')).toBe(true);
    });

    it('should not throw on a large adversarial hash (linear matching)', () => {
        const longValue = 'a'.repeat(10_000);
        const startedAt = Date.now();

        expect(isRouteMatch('/users/:id/:type', `/users/${longValue}/${longValue}`)).toBe(true);
        expect(Date.now() - startedAt).toBeLessThan(1000);
    });

    it('should not match when the payload splits into too many segments', () => {
        expect(isRouteMatch('/users/:id', '/users/a/b')).toBe(false);
        expect(isRouteMatch('/users/:id', '/users/<script>/x')).toBe(false);
    });
});

describe('security/navigation', () => {
    it('should percent-encode HTML payloads when constructing the URL', () => {
        const nav = createHashNavigation();

        nav.navigate('/users/<script>alert(1)</script>');

        expect(nav.currentEntry.value.url).toContain('/users/%3Cscript%3Ealert(1)%3C/script%3E');
        expect(nav.currentEntry.value.url).not.toContain('<script>');
    });

    it('should keep javascript:/data: payloads inside the same-origin fragment', () => {
        const nav = createHashNavigation();

        nav.navigate('javascript:alert(1)');
        expect(nav.currentEntry.value.url).toBe(`${window.location.origin}/#/javascript:alert(1)`);

        nav.navigate('data:text/html,<script>alert(1)</script>');
        expect(nav.currentEntry.value.url.startsWith(`${window.location.origin}/#/data:text/html,`)).toBe(true);
        expect(nav.currentEntry.value.url).not.toContain('<script>');
    });

    it('should strip CRLF and control characters from the URL', () => {
        const nav = createHashNavigation();

        nav.navigate('/a\r\nSet-Cookie: x=1\r\nb');

        const url = nav.currentEntry.value.url;

        expect(url).not.toContain('\r');
        expect(url).not.toContain('\n');
        expect(url).not.toContain('\t');
    });

    it('should decode params and query exactly once end-to-end', () => {
        const nav = createHashNavigation();
        const router = createHashRouter(nav);

        router.create({
            config  : { homeUrl: 'search', routeNames: ['search/:query'], },
            onChange: () => { /* noop */ },
        });

        nav.navigate('/search/%3Cscript%3Ealert(1)%3C%2Fscript%3E?q=%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E');

        const entry = router.currentEntry.value;

        expect(entry.getParams<{ query: string; }>().query).toBe('<script>alert(1)</script>');
        expect(entry.getQuery().q).toBe('"><img src=x onerror=alert(1)>');
    });
});

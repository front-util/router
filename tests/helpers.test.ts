/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect, beforeAll} from 'bun:test';

import {
    getClearedHistoryFullHash,
    getClearedHistoryHash,
    getQueryFromHash,
    createHash,
    getQueryFromUrl,
    getHashFromUrl,
    modifyLocation,
    checkIsHistoryInstance,
    createLocationFromNavEntry
} from '#src/helpers';
import { RouterLocation } from '#src/types';

describe('[helpers]', () => {
    beforeAll(() => {
        global.window = {
            navigation: {},
        } as any;
    });
    
    describe('- createHash', () => {
    // Create hash with only hash parameter and no query state
        it('should create hash with only hash parameter when queryState is not provided', () => {
            const hash = 'test-hash';
            const expected = '#/#test-hash';
  
            const result = createHash(hash);
  
            expect(result).toBe(expected);
        });

        // Create hash with undefined queryState parameter
        it('should create hash without query string when queryState is undefined', () => {
            const hash = 'test-hash';
            const queryState = undefined;
            const expected = '#/#test-hash';
  
            const result = createHash(hash, queryState);
  
            expect(result).toBe(expected);
        });

        it('should create hash without query string when queryState is object', () => {
            const hash = 'test-hash';
            const queryState = {
                query1: 'query1',
                query2: 'query2',
            };
            const expected = '#/#test-hash?query1=query1&query2=query2';
  
            const result = createHash(hash, queryState);
  
            expect(result).toBe(expected);
        });
    });

    describe('- getClearedHistoryFullHash', () => {
    // Remove # character from hash string
        it('should remove # character from hash string', () => {
            const hash = '#/some/path';
            const result = getClearedHistoryFullHash(hash);

            expect(result).toBe('/some/path');
        });

        // Handle null input by using default empty string parameter
        it('should return empty string when no hash provided', () => {
            const result = getClearedHistoryFullHash();

            expect(result).toBe('');
        });
    });

    describe('- getClearedHistoryHash', () => {
    // Returns empty string when no hash is provided
        it('should return empty string when hash parameter is not provided', () => {
            const result = getClearedHistoryHash();

            expect(result).toBe('');
        });

        // Handles hash with only query params (no path)
        it('should return empty string when hash contains only query params', () => {
            const hashWithOnlyParams = '#?param1=value1&param2=value2';
            const result = getClearedHistoryHash(hashWithOnlyParams);

            expect(result).toBe('');
        });
    });

    describe('- getQueryFromUrl', () => {
    // Returns query string part after '?' from valid URL with query parameters
        it('should return query string part when URL contains query parameters', () => {
            const url = 'https://example.com?param1=value1&param2=value2';
            const result = getQueryFromUrl(url);

            expect(result).toBe('param1=value1&param2=value2');
        });

        // Handles URL with only '?' and no query parameters
        it('should return empty string when URL has only question mark', () => {
            const url = 'https://example.com?';
            const result = getQueryFromUrl(url);

            expect(result).toBe('');
        });
    });

    describe('- getHashFromUrl', () => {
    // Returns part after URL_DELIMETER when URL contains the delimiter
        it('should return content after URL_DELIMETER when URL contains the delimiter', () => {
            const url = 'https://example.com#/#content';
            const result = getHashFromUrl(url);

            expect(result).toBe('content');
        });

        // Handles URL with only URL_DELIMETER and no content after it
        it('should return undefined when URL has only delimiter with no content after', () => {
            const url = 'https://example.com#/#';
            const result = getHashFromUrl(url);

            expect(result).toBe("");
        });
    });

    describe('- getQueryFromHash', () => {
    // Hash with single query parameter returns object with key-value pair
        it('should return object with key-value pair when hash contains single query parameter', () => {
            const hash = '?param1=value1';
            const result = getQueryFromHash(hash);

            expect(result).toEqual({ param1: 'value1', });
        });

        // Hash with missing value in key=value pair
        it('should handle key with missing value in query parameter', () => {
            const hash = '?param1=';
            const result = getQueryFromHash(hash);

            expect(result).toEqual({ param1: '', });
        });

        // Hash with multiple query parameters returns object with all key-value pairs
        it('should return object with all key-value pairs when hash has multiple query parameters', () => {
            const hash = '#?param1=value1&param2=value2';
            const result = getQueryFromHash(hash);

            expect(result).toEqual({ param1: 'value1', param2: 'value2', });
        });

        // Empty hash string returns null
        it('should return null when hash is empty', () => {
            const hash = '';
            const result = getQueryFromHash(hash);

            expect(result).toBeNull();
        });

        // Hash without query parameters returns null
        it('should return null when hash has no query parameters', () => {
            const hash = '#';
            const result = getQueryFromHash(hash);

            expect(result).toBeNull();
        });
    });

    describe('- modifyLocation', () => {
    // Returns modified location object with cleared hash and extracted query params
        it('should return location with cleared hash and extracted query params when hash contains query params', () => {
            const location = {
                hash    : '#/path?param1=value1&param2=value2',
                pathname: '/test',
            } as RouterLocation;

            const result = modifyLocation(location);

            expect(result).toEqual({
                hash    : '/path',
                pathname: '/test',
                query   : {
                    param1: 'value1',
                    param2: 'value2',
                },
            } as any);
        });

        // Handles empty location hash
        it('should return location with null query when hash is empty', () => {
            const location = {
                hash    : '',
                pathname: '/test',
            } as RouterLocation;

            const result = modifyLocation(location);

            expect(result).toEqual({
                hash    : '',
                pathname: '/test',
                query   : null,
            } as any);
        });
    });

    describe('checkIsHistoryInstance', () => {
    // Returns true when history object has all required methods (push, back, replace, listen)
        it('should return true when history object has all required methods', () => {
            const history = {
                location: { pathname: '/', },
                push    : () => {},
                back    : () => {},
                replace : () => {},
                listen  : () => () => {},
                go      : () => {},
                forward : () => {},
            } as any;

            const result = checkIsHistoryInstance(history);

            expect(result).toBe(true);
        });

        // Returns false when history object is missing any of the required methods
        it('should return false when history object is missing required methods', () => {
            const history = {
                location: { pathname: '/', },
                push    : () => {},
                back    : () => {},
                // missing replace and listen
                go      : () => {},
                forward : () => {},
            } as any;

            const result = checkIsHistoryInstance(history);

            expect(result).toBe(false);
        });
    });

    describe('- createLocationFromNavEntry', () => {
    // Creates location object from valid NavigationHistoryEntry with all properties
        it('should create location object with all properties when given valid NavigationHistoryEntry', () => {
            const mockEntry = {
                url     : 'https://example.com/path?query=1#/#hash',
                key     : 'key1',
                getState: () => ({ some: 'state', }),
            } as NavigationHistoryEntry;

            const location = createLocationFromNavEntry(mockEntry);

            expect(location).toEqual({
                pathname: 'https://example.com/path?query=1#/#hash',
                search  : 'query=1#/#hash',
                hash    : 'hash',
                state   : { some: 'state', },
                key     : 'key1',
            });
        });

        // Handles undefined entry parameter gracefully
        it('should use window.navigation.currentEntry when entry parameter is undefined', () => {
            const mockCurrentEntry = {
                url     : 'https://example.com',
                key     : 'current-key',
                getState: () => null,
            };
  
            global.window.navigation = { currentEntry: mockCurrentEntry, } as any;

            const location = createLocationFromNavEntry(undefined);

            expect(location).toEqual({
                pathname: 'https://example.com',
                search  : undefined,
                hash    : undefined,
                state   : null,
                key     : 'current-key',
            } as any);
        });
    });
});

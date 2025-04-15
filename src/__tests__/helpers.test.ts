/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { getHash, createHistoryEntry, createNavigationResult } from '#src/helpers';
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

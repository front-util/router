import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHashNavigation } from '../core/hashNavigation';

const startTestUrl = 'http://localhost:5000/test';

// Mock browser environment
const mockHistoryState = {};
const mockLocation = {
    href: startTestUrl,
    hash: '',
};

// Setup mocks
beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
        value: {
            ...mockLocation,
            assign : vi.fn(),
            replace: vi.fn(),
            reload : vi.fn(),
        },
        writable: true,
    });

    // Mock history API
    window.history.pushState = vi.fn();
    window.history.replaceState = vi.fn();
    window.history.back = vi.fn();
    window.history.forward = vi.fn();
    window.history.go = vi.fn();
    Object.defineProperty(window.history, 'state', {
        value   : mockHistoryState,
        writable: true,
    });
});

// Clean up mocks
afterEach(() => {
    vi.clearAllMocks();
});

describe('createHashNavigation', () => {
    it('should create a hash navigation instance with correct initial state', () => {
        const nav = createHashNavigation();
    
        expect(nav.currentEntry.value).toBeDefined();
        expect(nav.currentEntry.value.url).toBe('http://localhost:5000/test');
        expect(nav.currentEntry.value.getHash()).toBe('/');
        expect(nav.currentEntry.value.getState()).toEqual({});
        expect(nav.entries.value.length).toBe(1);
        expect(nav.canGoBack.value).toBe(false);
        expect(nav.canGoForward.value).toBe(false);

        nav.destroy();
    });

    it('should navigate to a new hash correctly', async () => {
        const nav = createHashNavigation();
    
        // Navigate to a new URL
        const result = nav.navigate('about');
    
        // Check if history.pushState was called correctly
        expect(window.history.pushState).toHaveBeenCalledWith(null, '', `${startTestUrl}#/about`);
    
        // Verify the navigation result
        expect(result).toBeDefined();
        expect(result.committed).toBeInstanceOf(Promise);
        expect(result.finished).toBeInstanceOf(Promise);
    
        // Check updated state
        expect(nav.entries.value.length).toBe(2);
        expect(nav.currentEntry.value.url).toContain('#/about');
        expect(nav.canGoBack.value).toBe(true);
        expect(nav.canGoForward.value).toBe(false);

        nav.destroy();
    });

    it('should not create new entries when navigating to the same hash', () => {    
        // Set initial URL
        Object.defineProperty(window.location, 'href', {
            value   : `${startTestUrl}#/about`,
            writable: true,
        });
        const nav = createHashNavigation();

        // Navigate to the same hash
        nav.navigate('about');
    
        // Should not create a new entry
        expect(nav.entries.value.length).toBe(1);
    });

    it('should update state without creating new entry when only state changes', () => {
        const nav = createHashNavigation();
    
        // Navigate with state
        nav.navigate('', { state: { test: 'state', }, });
    
        // State should be updated
        expect(nav.currentEntry.value.state).toEqual({ test: 'state', });
        expect(nav.entries.value.length).toBe(1);
    });

    it('should handle back navigation correctly', () => {
        const nav = createHashNavigation();
    
        // First navigate to create history
        nav.navigate('about');
        nav.navigate('contact');
    
        expect(nav.currentEntry.value.url).toContain('/contact');
        expect(nav.canGoBack.value).toBe(true);
        expect(nav.canGoForward.value).toBe(false);

        nav.back();

        expect(window.history.back).toHaveBeenCalled();
    
        // Verify state after back navigation
        expect(nav.currentEntry.value.url).toContain('/about');
        expect(nav.canGoBack.value).toBe(true);
        expect(nav.canGoForward.value).toBe(true);
    });

    it('should handle forward navigation correctly', () => {
        const nav = createHashNavigation();
    
        // Setup navigation history
        nav.navigate('about');
        nav.navigate('contact');
        nav.back();
    
        // Verify browser history.forward was called
        expect(window.history.back).toHaveBeenCalled();

        expect(nav.currentEntry.value.url).toContain('/about');
        expect(nav.canGoForward.value).toBe(true);

        nav.forward();

        // Verify state after forward navigation
        expect(nav.currentEntry.value.url).toContain('/contact');
        expect(nav.canGoBack.value).toBe(true);
        expect(nav.canGoForward.value).toBe(false);
    });

    it('should handle traverse to a specific entry correctly', () => {
        const nav = createHashNavigation();
    
        // Setup history with multiple entries
        nav.navigate('about');
        nav.navigate('contact');
        nav.navigate('products');
    
        // Get the key of the 'about' entry
        const aboutEntryKey = nav.entries.value[1].key;
    
        // Traverse to the about entry
        nav.traverseTo(aboutEntryKey);
    
        // Check if history.go was called with the correct delta (-2)
        expect(window.history.go).toHaveBeenCalledWith(-2);
    });

    it('should update current entry state correctly', () => {
        const nav = createHashNavigation();
    
        // Update the current entry state
        nav.updateCurrentEntry({ state: { updated: true, }, });
    
        // Verify history.replaceState was called
        expect(window.history.replaceState).toHaveBeenCalledWith(
            { updated: true, },
            '',
            window.location.hash
        );
    
        // Verify entry state was updated
        expect(nav.currentEntry.value.state).toEqual({ updated: true, });
    });

    it('should reload the current entry correctly', () => {
        const nav = createHashNavigation();
    
        // Navigate to a page
        nav.navigate('about', { state: { initial: true, }, });
    
        // Reload with new state
        nav.reload({ state: { reloaded: true, }, });
    
        // Verify history.replaceState was called
        expect(window.history.replaceState).toHaveBeenCalledWith(
            { reloaded: true, },
            '',
            expect.stringContaining('/about')
        );
    
        // Verify entry state was updated
        expect(nav.currentEntry.value.state).toEqual({ reloaded: true, });
    });

    it('should handle event listeners correctly', () => {
        const nav = createHashNavigation();
    
        // Create mock listeners
        const listener1 = vi.fn();
        const listener2 = vi.fn();
    
        // Add event listeners
        nav.addEventListener('navigate', listener1);
        nav.addEventListener('navigate', listener2);
    
        // Trigger a navigation to fire the event
        nav.navigate('events-test');
    
        // Verify both listeners were called
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
    
        // Remove one listener
        nav.removeEventListener('navigate', listener1);
    
        // Trigger another navigation
        nav.navigate('after-remove');
    
        // First listener should not be called again
        expect(listener1).toHaveBeenCalledTimes(1);
        // Second listener should be called twice
        expect(listener2).toHaveBeenCalledTimes(2);
    });

    it('should clean up resources when destroyed', () => {
        const nav = createHashNavigation();

        // Create mock listeners
        const listener1 = vi.fn();
        const listener2 = vi.fn();
            
        // Add event listeners
        nav.addEventListener('navigate', listener1);
        nav.addEventListener('navigate', listener2);

        nav.navigate('before-remove');
    
        // Destroy the navigation instance
        nav.destroy();

        nav.navigate('after-remove');
    
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should correct set state during navigation', () => {
        const nav = createHashNavigation();
        const states = [{}, {num: 1,}, {num: 2,}, {num: 3,}];

        nav.navigate('nav1', {state: states[1],});
        nav.navigate('nav2', {state: states[2],});
        nav.navigate('nav3', {state: states[3],});
    
        nav.entries.value.forEach((ent, index) => {            
            expect(ent.getState()).toEqual(states[index]);
        });

        nav.back();

        expect(nav.currentEntry.value.getState()).toEqual(states[2]);

        nav.forward();

        expect(nav.currentEntry.value.getState()).toEqual(states[3]);
        const secondNavKey = nav.entries.value[1].key;

        nav.traverseTo(secondNavKey);
        expect(nav.currentEntry.value.getState()).toEqual(states[1]);
    });
});
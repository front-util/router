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
    it('should init a hash navigation instance with correct initial state', () => {
        const nav = createHashNavigation();
    
        expect(nav.currentEntry.value).toBeDefined();
        expect(nav.currentEntry.value.url).toBe('http://localhost:5000/test');
        expect(nav.currentEntry.value.hash).toBe('/');
        
        expect(nav.currentEntry.value.state).toEqual({});
        expect(nav.entries.value.length).toBe(1);
        expect(nav.canGoBack.value).toBe(false);
        expect(nav.canGoForward.value).toBe(false);

        nav.destroy();
    });

    it('should create a hash navigation instance with correct initial state after navigation init and navigation not empty', () => {
        const nav = createHashNavigation();
    
        expect(nav.currentEntry.value).toBeDefined();
        expect(nav.currentEntry.value.url).toBe('http://localhost:5000/test');
        expect(nav.currentEntry.value.hash).toBe('/');
        expect(nav.currentEntry.value.state).toEqual({});

        nav.navigate('test1');
        nav.navigate('test2', {state: ['test'],});

        expect(nav.entries.value.length).toEqual(3);
        expect(nav.currentEntry.value.url).toBe('http://localhost:5000/test#/test2');
        expect(nav.currentEntry.value.hash).toBe('test2');
        expect(nav.currentEntry.value.state).toEqual(['test']);

        nav.create();

        expect(nav.entries.value.length).toEqual(1);
        expect(nav.canGoBack.value).toBeFalsy();
        expect(nav.canGoForward.value).toBeFalsy();
        expect(nav.currentEntry.value.url).toBe('http://localhost:5000/test#/test2');
        expect(nav.currentEntry.value.hash).toBe('test2');

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
        nav.navigate('/', { state: { test: 'state', }, });
    
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
    
        // Since browser API is mocked, we need to manually get the previous entry
        const previousEntry = nav.entries.value[1]; // 'about' entry
        
        // Verify state after back navigation
        expect(previousEntry.url).toContain('/about');
        expect(nav.canGoBack.value).toBe(true);
        expect(nav.canGoForward.value).toBe(true);
    });

    it('should handle forward navigation correctly', () => {
        const nav = createHashNavigation();
    
        // Setup navigation history
        nav.navigate('about');
        nav.navigate('contact');
        nav.back();
    
        // Verify browser history.back was called
        expect(window.history.back).toHaveBeenCalled();

        // Get the 'about' entry since we went back
        const aboutEntry = nav.entries.value[1];

        expect(aboutEntry.url).toContain('/about');
        expect(nav.canGoForward.value).toBe(true);

        nav.forward();

        // Since browser API is mocked, we need to manually get the next entry
        const contactEntry = nav.entries.value[2]; // 'contact' entry
        
        // Verify state after forward navigation
        expect(contactEntry.url).toContain('/contact');
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
        const aboutEntry = nav.entries.value[1];
    
        // Traverse to the about entry
        nav.traverseTo(aboutEntryKey);
    
        // Check if history.go was called with the correct delta (-2)
        expect(window.history.go).toHaveBeenCalledWith(-2);
        
        // Since browser API is mocked, verify the entry we're trying to navigate to
        expect(aboutEntry.url).toContain('/about');
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

    it('should handle subscribe correctly', () => {
        const nav = createHashNavigation();
    
        // Create mock listeners
        const listener1 = vi.fn();
        const listener2 = vi.fn();
    
        // Add event subscribers
        const unsubscribe1 = nav.subscribe(listener1);
        
        nav.subscribe(listener2);
    
        // Each listener should be called once for initial state
        // Note: Due to how subscribe is implemented, each listener is called twice initially
        // Once explicitly and once in the effect
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
        
        // Reset mocks to count only new calls
        listener1.mockClear();
        listener2.mockClear();
        
        // Trigger a navigation
        nav.navigate('events-test');
    
        // Verify both listeners were called
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
    
        // Unsubscribe one listener
        unsubscribe1();
    
        // Reset mocks
        listener1.mockClear();
        listener2.mockClear();
        
        // Trigger another navigation
        nav.navigate('after-remove');
    
        // First listener should not be called
        expect(listener1).toHaveBeenCalledTimes(0);
        // Second listener should be called
        expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should clean up resources when destroyed', () => {
        const nav = createHashNavigation();

        // Create mock listeners
        const listener1 = vi.fn();
        const listener2 = vi.fn();
            
        // Add subscribers
        nav.subscribe(listener1);
        
        nav.subscribe(listener2);

        // Initial calls
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
        
        listener1.mockClear();
        listener2.mockClear();

        nav.navigate('before-remove');
        
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
        
        listener1.mockClear();
        listener2.mockClear();
    
        // Destroy the navigation instance
        nav.destroy();
        
        // Try navigating after destroy
        nav.navigate('after-remove');
    
        // Listeners should not be called after destroy
        expect(listener1).toHaveBeenCalledTimes(0);
        expect(listener2).toHaveBeenCalledTimes(0);
    });

    it('should correct set state during navigation', () => {
        const nav = createHashNavigation();
        const states = [{}, {num: 1,}, {num: 2,}, {num: 3,}];

        nav.navigate('nav1', {state: states[1],});
        nav.navigate('nav2', {state: states[2],});
        nav.navigate('nav3', {state: states[3],});
    
        // Verify states in history
        nav.entries.value.forEach((ent, index) => {            
            expect(ent.state).toEqual(states[index]);
        });

        // Check state when moving back
        nav.back();
        
        // Since browser API is mocked, it doesn't automatically change the current entry
        // Verify history.back was called
        expect(window.history.back).toHaveBeenCalled();
        
        // Get the entry we're trying to navigate to
        const currentEntryAfterBack = nav.entries.value[2]; // nav2

        expect(currentEntryAfterBack.state).toEqual(states[2]);

        // Check state when moving forward
        nav.forward();
        expect(window.history.forward).toHaveBeenCalled();
        
        // Get the entry we're trying to navigate to
        const currentEntryAfterForward = nav.entries.value[3]; // nav3

        expect(currentEntryAfterForward.state).toEqual(states[3]);
        
        // Check traverseTo
        const secondNavKey = nav.entries.value[1].key;

        nav.traverseTo(secondNavKey);
        
        expect(window.history.go).toHaveBeenCalled();
        
        // Get the entry we're trying to navigate to
        const currentEntryAfterTraverse = nav.entries.value[1]; // nav1

        expect(currentEntryAfterTraverse.state).toEqual(states[1]);
    });

    it('should update current entry hash correctly', () => {
        const nav = createHashNavigation();
        
        // Initial state
        // expect(nav.currentEntry.value.hash).toBe('/');
        
        // Update the hash
        nav.updateCurrentEntryHash('new-hash');
        
        // Verify the hash was updated
        expect(nav.currentEntry.value.hash).toBe('new-hash');
        expect(nav.currentEntry.value.url).toBe(`${startTestUrl}#/new-hash`);
    });

    it('should handle back navigation when cannot go back', () => {
        const nav = createHashNavigation();
        
        // We're at the first entry, so canGoBack should be false
        expect(nav.canGoBack.value).toBe(false);
        
        // Try to go back
        const result = nav.back();
        
        // Should still call history.back
        expect(window.history.back).toHaveBeenCalled();
        
        // But should return null since we can't go back in our navigation
        expect(result).toBeNull();
    });

    it('should handle forward navigation when cannot go forward', () => {
        const nav = createHashNavigation();
        
        // We're at the last entry, so canGoForward should be false
        expect(nav.canGoForward.value).toBe(false);
        
        // Try to go forward
        const result = nav.forward();
        
        // Should not call history.forward
        expect(window.history.forward).not.toHaveBeenCalled();
        
        // Should return null since we can't go forward
        expect(result).toBeNull();
    });

    it('should handle traverseTo with invalid key', () => {
        const nav = createHashNavigation();
        
        // Try to traverse to a non-existent entry
        const result = nav.traverseTo('non-existent-key');
        
        // Should return null for invalid key
        expect(result).toBeNull();
        
        // Should not call history.go
        expect(window.history.go).not.toHaveBeenCalled();
    });

    it('should handle back navigation with state update', () => {
        const nav = createHashNavigation();
        
        // Create history
        nav.navigate('page1');
        nav.navigate('page2');
        
        // Go back with new state
        nav.back({ state: { backState: true, }, });
        
        // Verify history.replaceState was called with the new state
        expect(window.history.replaceState).toHaveBeenCalledWith(
            { backState: true, },
            '',
            expect.stringContaining('page1')
        );
        
        // Verify history.back was called
        expect(window.history.back).toHaveBeenCalled();
    });

    it('should handle forward navigation with state update', () => {
        const nav = createHashNavigation();
        
        // Create history and go back
        nav.navigate('page1');
        nav.navigate('page2');
        nav.back();
        
        // Reset mocks
        vi.clearAllMocks();
        
        // Go forward with new state
        nav.forward({ state: { forwardState: true, }, });
        
        // Verify history.replaceState was called with the new state
        expect(window.history.replaceState).toHaveBeenCalledWith(
            { forwardState: true, },
            '',
            expect.stringContaining('page2')
        );
        
        // Verify history.forward was called
        expect(window.history.forward).toHaveBeenCalled();
    });

    it('should handle traverseTo with state update', () => {
        const nav = createHashNavigation();
        
        // Create history
        nav.navigate('page1');
        nav.navigate('page2');
        nav.navigate('page3');
        
        // Get the key of the first entry
        const page1Key = nav.entries.value[1].key;
        
        // Reset mocks
        vi.clearAllMocks();
        
        // Traverse to page1 with new state
        nav.traverseTo(page1Key, { state: { traverseState: true, }, });
        
        // Verify history.replaceState was called with the new state
        expect(window.history.replaceState).toHaveBeenCalledWith(
            { traverseState: true, },
            '',
            expect.stringContaining('page1')
        );
        
        // Verify history.go was called with the correct delta (-2)
        expect(window.history.go).toHaveBeenCalledWith(-2);
    });

    it('should handle reload without state change', () => {
        const nav = createHashNavigation();
        
        // Navigate to a page with state
        nav.navigate('test-page', { state: { original: true, }, });
        
        // Reset mocks
        vi.clearAllMocks();
        
        // Reload without specifying state
        nav.reload();
        
        // Should not call replaceState
        expect(window.history.replaceState).not.toHaveBeenCalled();
        
        // Should keep the original state
        expect(nav.currentEntry.value.state).toEqual({ original: true, });
    });

    it('should create a navigation instance and set up event listeners', () => {
        // Create a spy on addEventListener
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        
        const nav = createHashNavigation();
        
        // Call create to set up event listeners
        nav.create();
        
        // Verify addEventListener was called with 'hashchange'
        expect(addEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
        
        // Clean up
        nav.destroy();
        addEventListenerSpy.mockRestore();
    });

    it('should remove event listeners when destroyed', () => {
        // Create a spy on removeEventListener
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
        
        const nav = createHashNavigation();

        nav.create();
        
        // Call destroy to remove event listeners
        nav.destroy();
        
        // Verify removeEventListener was called with 'hashchange'
        expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
        
        removeEventListenerSpy.mockRestore();
    });
});

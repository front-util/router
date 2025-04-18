import { signal, computed, effect, batch } from '@preact/signals';

import type { 
    NavigationResult, 
    NavigationState, 
    NavigationHistoryEntry, 
    NavigationOptions, 
    HashNavigation
} from '#src/types';
import { 
    createHistoryEntry, 
    createNavigationResult, 
    getHash, 
    createHash 
} from '#src/helpers';

/**
 * Implementation of hash-based router core using Preact signals
 * and following the Navigation API interface, while using window.history for compatibility
 */
export const createHashNavigation = (): HashNavigation => {
    // Internal signals to manage router state
    const _currentURL = signal<string>(window.location.href);
    const _entries = signal<NavigationHistoryEntry[]>([createHistoryEntry(window.location.href)]);
    const _currentIndex = signal<number>(0);
    const _navigations = signal<Map<string, NavigationResult>>(new Map());
    const _eventListeners = new Map<string, Set<EventListener>>();

    // Public computed signals that reflect the router state
    const currentEntry = computed(() => _entries.value[_currentIndex.value]);
    const entries = computed(() => [..._entries.value]);
    const canGoBack = computed(() => _currentIndex.value > 0);
    const canGoForward = computed(() => _currentIndex.value < _entries.value.length - 1);

    // Initialize the router state from the current location
    const initializeFromLocation = (): void => {
        // Try to get existing state from the history API        
        const state = window.history.state ?? currentEntry.value.getState();
        
        const initialEntry = createHistoryEntry(_currentURL.value, state);
        
        // Using batch to update multiple signals at once
        batch(() => {
            _currentURL.value = initialEntry.url as string;
            _entries.value = [initialEntry];
            _currentIndex.value = 0;
        });
    };

    const dispatchEvent = (type: string, event: Event): void => {
        if(_eventListeners.has(type)) {
            const listeners = _eventListeners.get(type);
            
            if(listeners) {
                listeners.forEach((listener) => listener(event));
            }
        }
    };

    // Create and dispatch a custom navigate event
    const dispatchNavigateEvent = (): void => {
        const currentDestination = currentEntry.value;
            
        // Create a custom event that mimics NavigateEvent
        const event = new CustomEvent('navigate', {
            bubbles   : true,
            cancelable: true,
        });
            
        // Add NavigateEvent properties
        Object.defineProperties(event, {
            destination: {
                value   : currentDestination,
                writable: false,
            },
            canIntercept: {
                value   : true,
                writable: false,
            },
            intercept: {
                value: (options: { handler?: () => Promise<void> | void } = {}) => {
                    if(options.handler) {
                        options.handler();
                    }
                },
                writable: false,
            },
            scroll: {
                value   : () => window.scrollTo(0, 0),
                writable: false,
            },
        });
            
        // Dispatch the event
        dispatchEvent('navigate', event);
    };

    // Handle hash change events from the window
    const handleHashChange = (event: HashChangeEvent): void => {        
        // This is triggered by the browser, so we need to update our state
        const newUrl = event.newURL;
        const state = window.history.state;
        
        // Check if this is a navigation we already know about
        const existingEntryIndex = _entries.value.findIndex((entry) => entry.url === newUrl);
        
        if(existingEntryIndex >= 0) {
            // If we already have this entry, just update the index
            _currentIndex.value = existingEntryIndex;
            
            // Update state if it has changed
            const existingEntry = _entries.value[existingEntryIndex];

            if(JSON.stringify(existingEntry.state) !== JSON.stringify(state)) {
                const updatedEntries = [..._entries.value];

                updatedEntries[existingEntryIndex] = {
                    ...existingEntry,
                    state,
                };
                _entries.value = updatedEntries;
            }
        } else {
            // Otherwise, create a new entry
            const newEntry = createHistoryEntry(newUrl, state, _entries.value.length);
            const newEntries = [..._entries.value];
            
            // If we navigated from a point in history, remove the forward entries
            if(_currentIndex.value < _entries.value.length - 1) {
                newEntries.splice(_currentIndex.value + 1);
            }
            
            newEntries.push(newEntry);
            
            // Using batch to update multiple signals at once
            batch(() => {
                _entries.value = newEntries;
                _currentIndex.value = newEntries.length - 1;
            });
        }

        // Dispatch navigate event
        dispatchNavigateEvent();
    };

    // Helper function to update navigation state
    const updateNavigationState = (
        destination: NavigationHistoryEntry,
        newCurrentIndex: number,
        newUrl?: string
    ): NavigationResult => {
        // Create a navigation result
        const result = createNavigationResult(destination);
        
        // Store the navigation for potential future reference
        const navigations = new Map(_navigations.value);

        navigations.set(destination.key, result);
        
        // Using batch to update multiple signals at once
        batch(() => {
            if(newUrl) {
                _currentURL.value = newUrl;
            }
            _currentIndex.value = newCurrentIndex;
            _navigations.value = navigations;
        });
        
        return result;
    };

    // Handle entry state updates
    const updateEntryState = (
        entryIndex: number,
        newState: NavigationState | null | undefined
    ): NavigationHistoryEntry => {
        const newEntries = [..._entries.value];
        const entry = newEntries[entryIndex];
        
        // Create updated entry with new state
        const updatedEntry = {
            ...entry,
            state: newState,
        };
        
        // Update our entries array
        newEntries[entryIndex] = updatedEntry;
        _entries.value = newEntries;
        
        return updatedEntry;
    };

    const updateEntryUrl = (
        entryIndex: number,
        newUrl: string
    ): NavigationHistoryEntry => {
        const newEntries = [..._entries.value];
        const entry = newEntries[entryIndex];
        
        // Create updated entry with new state
        const updatedEntry = {
            ...entry,
            url: newUrl,
        };
        
        // Update our entries array
        newEntries[entryIndex] = updatedEntry;
        _entries.value = newEntries;
        
        return updatedEntry;
    };

    const updateCurrentEntryHash = (hash: string) => {
        updateEntryUrl(
            _currentIndex.value, 
            new URL(`#${createHash(hash)}`, window.location.href).href
        );
    };

    // Public API methods
    const navigate = (hash: string, options: NavigationOptions = {}): NavigationResult => {
        // Create full URL by resolving against current location
        const originalHash = currentEntry.value.getHash();
        const fullUrl = new URL(`#${createHash(hash)}`, window.location.href).href;
        
        // Only navigate if the hash part actually changed
        if(originalHash !== hash) {            
            // Create a new destination with state from options
            const destination = createHistoryEntry(fullUrl, options.state as NavigationState, _entries.value.length);
            
            // Use history pushState to update the URL without reloading
            window.history.pushState(options.state || null, '', fullUrl);
            
            // Update our internal state
            const newEntries = [..._entries.value];
            
            // If we navigated from a point in history, remove the forward entries
            if(_currentIndex.value < _entries.value.length - 1) {
                newEntries.splice(_currentIndex.value + 1);
            }
            
            newEntries.push(destination);
            
            // Using batch to update multiple signals at once
            batch(() => {
                _entries.value = newEntries;
                _currentIndex.value = newEntries.length - 1;
                _currentURL.value = fullUrl;
            });
            
            // Update navigation state and dispatch navigate event
            const result = updateNavigationState(destination, newEntries.length - 1);

            dispatchNavigateEvent();
            
            return result;
        } else {
            // If hash didn't change, check if state changed
            const currentEntryValue = currentEntry.value;

            if(options.state && JSON.stringify(currentEntryValue.state) !== JSON.stringify(options.state)) {
                // Update state without changing URL
                window.history.replaceState(options.state, '', fullUrl);
                
                const updatedEntry = updateEntryState(_currentIndex.value, options.state as NavigationState);
                
                // Create and return a navigation result for the updated entry
                return createNavigationResult(updatedEntry);
            }
            
            // If nothing changed, return a result that resolves immediately with current entry
            return createNavigationResult(currentEntryValue);
        }
    };

    const traverseTo = (key: string, options: NavigationOptions = {}): NavigationResult | null => {
        const entryIndex = _entries.value.findIndex((entry) => entry.key === key);
        
        if(entryIndex === -1) {
            return null;
        }
        
        const destination = _entries.value[entryIndex];
        const delta = entryIndex - _currentIndex.value;
        
        // Handle potential state update if options include state
        let updatedDestination = destination;

        if(options.state) {
            // Update history state and our entries
            window.history.replaceState(options.state, '', destination.url);
            updatedDestination = updateEntryState(entryIndex, options.state as NavigationState);
        }
        
        // Use history.go to navigate through history
        window.history.go(delta);
        
        // Update navigation state
        return updateNavigationState(updatedDestination, entryIndex, updatedDestination.url);
    };

    const back = (options: NavigationOptions = {}): NavigationResult | null => {
        if(!canGoBack.value) {
            window.history.back();
            return null;
        }
        
        const prevIndex = _currentIndex.value - 1;
        let destination = _entries.value[prevIndex];
        
        // Handle potential state update if options include state
        if(options.state) {
            // Update history state before going back
            window.history.replaceState(options.state, '', destination.url);
            destination = updateEntryState(prevIndex, options.state as NavigationState);
        }
        
        // Use history.back to navigate back
        window.history.back();
        
        // Update navigation state
        return updateNavigationState(destination, prevIndex, destination.url);
    };

    const forward = (options: NavigationOptions = {}): NavigationResult | null => {
        if(!canGoForward.value) {
            return null;
        }
        
        const nextIndex = _currentIndex.value + 1;
        let destination = _entries.value[nextIndex];
        
        // Handle potential state update if options include state
        if(options.state) {
            // Update history state before going forward
            window.history.replaceState(options.state, '', destination.url);
            destination = updateEntryState(nextIndex, options.state as NavigationState);
        }
        
        // Use history.forward to navigate forward
        window.history.forward();
        
        // Update navigation state
        return updateNavigationState(destination, nextIndex, destination.url);
    };

    const reload = (options: NavigationOptions = {}): NavigationResult => {
        const currentEntryValue = currentEntry.value;
        
        // Create a new destination to represent the reload, potentially with updated state
        const state = options.state !== undefined ? options.state : currentEntryValue.state;
        const destination = createHistoryEntry(currentEntryValue.url, state, currentEntryValue.index);
        
        // Update history state if new state is provided
        if(options.state !== undefined) {
            window.history.replaceState(options.state, '', currentEntryValue.url);
            updateEntryState(_currentIndex.value, options.state as NavigationState);
        }
        
        // Actually reload the current hash route
        window.location.hash = getHash(currentEntryValue.url);
        
        // Update navigation state
        const result = createNavigationResult(destination);
        
        // Store the navigation for potential future reference
        const navigations = new Map(_navigations.value);

        navigations.set(destination.key, result);
        _navigations.value = navigations;
        
        return result;
    };

    const updateCurrentEntry = (options: NavigationOptions = {}): void => {
        const currentIndex = _currentIndex.value;
        
        // Update the history state
        window.history.replaceState(options.state || null, '', window.location.hash);
        
        // Update entry state
        updateEntryState(currentIndex, options.state as NavigationState || null);
    };

    // Event handling
    const addEventListener = (type: string, listener: EventListener): void => {
        if(!_eventListeners.has(type)) {
            _eventListeners.set(type, new Set());
        }
        _eventListeners.get(type)?.add(listener);
    };

    const removeEventListener = (type: string, listener: EventListener): void => {
        if(_eventListeners.has(type)) {
            _eventListeners.get(type)?.delete(listener);
        }
    };
    
    // Set up effect to synchronize URL with current entry
    const unsubscribe = effect(() => {
        const currentEntryValue = currentEntry.value;
        
        if(currentEntryValue && getHash(_currentURL.value) !== getHash(currentEntryValue.url as string)) {
            _currentURL.value = currentEntryValue.url as string;
        }
    });

    const create = () => {
        // Initialize and set up event listeners
        initializeFromLocation();
        window.addEventListener('hashchange', handleHashChange);
    };

    const destroy = (): void => {
        window.removeEventListener('hashchange', handleHashChange);
        _eventListeners.clear();
        unsubscribe();
    };

    // Return the public API
    return {
        // Public signals
        currentEntry,
        entries,
        canGoBack,
        canGoForward,
        
        // Navigation methods
        navigate,
        traverseTo,
        back,
        forward,
        reload,
        updateCurrentEntry,
        
        // Event handlers
        addEventListener,
        removeEventListener,

        // Service methods
        updateCurrentEntryHash,
        
        // Init
        create,
        // Cleanup
        destroy,
    };
};

// Export a singleton instance for convenience
export const hashNavigation = createHashNavigation();
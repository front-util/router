import { signal, computed, effect, batch } from '@preact/signals';

import type { 
    NavigationResult, 
    NavigationState, 
    NavigationHistoryEntry, 
    NavigationOptions, 
    HashNavigation
} from '../types';
import { 
    createHistoryEntry, 
    createNavigationResult, 
    getHash, 
    createHash 
} from '../helpers';

const createInitialState = () => ({
    url          : window.location.href,
    entries      : [createHistoryEntry(window.location.href)],
    index        : 0,
    subscriptions: new Set<VoidFunction>(),
});

/**
 * Implementation of hash-based router core using Preact signals
 * and following the Navigation API interface, while using window.history for compatibility
 */
export const createHashNavigation = (): HashNavigation => {
    const initialState = createInitialState();

    // Internal signals to manage router state
    const _currentURL = signal<string>(initialState.url);
    const _entries = signal<NavigationHistoryEntry[]>(initialState.entries);
    const _currentIndex = signal<number>(initialState.index);
    
    // Storage for active subscriptions
    const _subscriptions = initialState.subscriptions;
    
    // Public computed signals that reflect the router state
    const currentEntry = computed(() => _entries.value[_currentIndex.value]);
    const entries = computed(() => [..._entries.value]);
    const canGoBack = computed(() => _currentIndex.value > 0);
    const canGoForward = computed(() => _currentIndex.value < _entries.value.length - 1);
    const prevEntry = computed(() => {
        return _currentIndex.value > 0 ? _entries.value[_currentIndex.value - 1] : null;
    });

    // Initialize the router state from the current location
    const initializeFromLocation = (): void => {
        // Try to get existing state from the history API        
        const state = window.history.state;
        const initialEntry = createHistoryEntry(window.location.href, state);
            
        // Using batch to update multiple signals at once
        batch(() => {
            _currentURL.value = initialEntry.url as string;
            _entries.value = [initialEntry];
            _currentIndex.value = 0;
        });
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
    };

    // Helper function to update navigation state
    const updateNavigationState = (
        destination: NavigationHistoryEntry,
        newCurrentIndex: number,
        newUrl?: string
    ): NavigationResult => {
        // Create a navigation result
        const result = createNavigationResult(destination);
        
        // Using batch to update multiple signals at once
        batch(() => {
            if(newUrl) {
                _currentURL.value = newUrl;
            }
            _currentIndex.value = newCurrentIndex;
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
        
        // Create updated entry with new url
        const updatedEntry = {
            ...entry,
            url : newUrl,
            hash: getHash(newUrl),
        };
        
        // Update our entries array
        newEntries[entryIndex] = updatedEntry;
        _entries.value = newEntries;
        
        return updatedEntry;
    };

    const updateCurrentEntryHash = (hash: string) => {
        return updateEntryUrl(
            _currentIndex.value, 
            new URL(`#${createHash(hash)}`, window.location.href).href
        );
    };
    
    /**
     * Subscribe to navigation changes with current and previous history entries
     * and current hash route
     * @param callback - Callback function called when navigation changes
     * @returns Unsubscribe function
     */
    const subscribe = (
        callback: (
            entry: NavigationHistoryEntry, 
            prevEntry: NavigationHistoryEntry | null, 
            hash: string
        ) => void
    ): VoidFunction => {        
        // Get the current entry before setting up the effect
        const current = currentEntry.value;
        
        // Track the previous entry for change detection
        // Initialize with current to avoid double call
        let previousEntry: NavigationHistoryEntry | null = current;
        
        // Call the callback with the current value on initial subscription
        callback(current, null, current.hash);
        
        // Create an effect that tracks changes in the currentEntry signal
        const unsubscribe = effect(() => {
            const entry = currentEntry.value;
            const currentHash = entry.hash;
            
            // Call the callback with current and previous entries
            if(previousEntry !== entry) {
                callback(entry, previousEntry, currentHash);
                previousEntry = entry;
            }
        });
        
        // Create a complete unsubscribe function that also removes the subscription from storage
        const completeUnsubscribe = () => {
            unsubscribe();
            _subscriptions.delete(completeUnsubscribe);
        };
        
        // Save the subscription in storage
        _subscriptions.add(completeUnsubscribe);
        
        // Return the unsubscribe function
        return completeUnsubscribe;
    };
    
    // Public API methods
    const navigate = (hash: string, options: NavigationOptions = {}): NavigationResult => {
        // Create full URL by resolving against current location
        const originalHash = currentEntry.value.hash;
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
            
            // Update navigation state
            return updateNavigationState(destination, newEntries.length - 1);
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
        return createNavigationResult(destination);
    };

    const updateCurrentEntry = (options: NavigationOptions = {}): void => {
        const currentIndex = _currentIndex.value;
        
        // Update the history state
        window.history.replaceState(options.state || null, '', window.location.hash);
        
        // Update entry state
        updateEntryState(currentIndex, options.state as NavigationState || null);
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
        
        // Cancel all active subscriptions
        _subscriptions.forEach((unsub) => unsub());
        _subscriptions.clear();

        const newInitialState = createInitialState();

        batch(() => {
            _currentURL.value = newInitialState.url;
            _entries.value = newInitialState.entries;
            _currentIndex.value = newInitialState.index;
        });     
        
        // Cancel internal synchronization effect
        unsubscribe();
    };

    // Return the public API
    return {
        // Public signals
        currentEntry,
        prevEntry,
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
        
        // Subscription method
        subscribe,
        
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

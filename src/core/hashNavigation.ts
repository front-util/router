import { signal, computed, effect, batch } from '@preact/signals';

import type { 
    NavigationState, 
    NavigationHistoryEntry, 
    NavigationOptions, 
    HashNavigation
} from '../types';
import { 
    createHistoryEntry, 
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

        if(newUrl === currentEntry.value?.url) {
            return;
        }
        
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
        newCurrentIndex: number,
        newUrl?: string
    ) => {        
        // Using batch to update multiple signals at once
        batch(() => {
            if(newUrl) {
                _currentURL.value = newUrl;
            }
            _currentIndex.value = newCurrentIndex;
        });        
    };

    const setEntry = (entryIndex: number, entryPart: Partial<NavigationHistoryEntry>): NavigationHistoryEntry => {
        const newEntries = [..._entries.value];
        const entry = newEntries[entryIndex];
        
        // Create updated entry with new state
        const updatedEntry = {
            ...entry,
            ...entryPart,
        };
        
        // Update our entries array
        newEntries[entryIndex] = updatedEntry;
        _entries.value = newEntries;
        
        return updatedEntry;
    };

    // Handle entry state updates
    const updateEntryState = (
        entryIndex: number,
        newState: NavigationState | null | undefined
    ): NavigationHistoryEntry => {
        return setEntry(entryIndex, {
            state: newState,
        });
    };

    const replaceHistoryEntry = (
        fullUrl: string,
        newState: NavigationState | null | undefined,
        entryIndex: number = _currentIndex.value
    ): NavigationHistoryEntry => {
        window.history.replaceState(newState, '', fullUrl);
        return updateEntryState(entryIndex, newState);
    };

    const updateCurrentEntry = (options: NavigationOptions = {}): void => {
        replaceHistoryEntry(window.location.hash, options.state as NavigationState, _currentIndex.value);
    };

    // Handle entry hash updates
    const updateCurrentEntryHash = (hash: string, newState?: NavigationState | null | undefined) => {
        const newUrl = new URL(`#${createHash(hash)}`, window.location.href).href;

        window.history.replaceState(newState, '', newUrl);

        return setEntry(_currentIndex.value, {
            url : newUrl,
            hash: getHash(newUrl), 
            ...newState && {
                state: newState,
            },
        });
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
        let previousCallEntry: NavigationHistoryEntry | null = current;
        
        // Call the callback with the current value on initial subscription
        callback(current, prevEntry.value, current.hash);
        
        // Create an effect that tracks changes in the currentEntry signal
        const unsubscribe = effect(() => {
            const entry = currentEntry.value;
            const currentHash = entry.hash;
            
            // Call the callback with current and previous entries
            if(previousCallEntry !== entry) {
                callback(entry, prevEntry.value, currentHash);
                previousCallEntry = entry;
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
    const navigate = (hash: string, options: NavigationOptions = {}) => {
        // Create full URL by resolving against current location
        const originalHash = currentEntry.value.hash;
        const fullUrl = new URL(`#${createHash(hash)}`, window.location.href).href;
        
        // Only navigate if the hash part actually changed
        if(originalHash !== hash) {            
            // Create a new destination with state from options
            const destination = createHistoryEntry(fullUrl, options?.state as NavigationState, _entries.value.length);
            
            // Use history pushState to update the URL without reloading
            window.history.pushState(options?.state || null, '', fullUrl);
            
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
                updateNavigationState(newEntries.length - 1);
            });            
        } else {
            // If hash didn't change, check if state changed
            const currentEntryValue = currentEntry.value;

            if(options?.state && JSON.stringify(currentEntryValue.state) !== JSON.stringify(options?.state)) {
                // Update state without changing URL
                replaceHistoryEntry(fullUrl, options?.state as NavigationState);
            }
        }
    };

    const traverseTo = (key: string, options: NavigationOptions = {}) => {
        const entryIndex = _entries.value.findIndex((entry) => entry.key === key);
        
        if(entryIndex === -1) {
            return;
        }
        
        const destination = _entries.value[entryIndex];
        const delta = entryIndex - _currentIndex.value;
        
        // Handle potential state update if options include state
        let updatedDestination = destination;

        if(options.state) {
            // Update history state and our entries
            updatedDestination = replaceHistoryEntry(destination.url, options.state as NavigationState, entryIndex);
        }
        
        // Use history.go to navigate through history
        window.history.go(delta);
        
        // Update navigation state
        updateNavigationState(entryIndex, updatedDestination.url);
    };

    const back = () => {
        if(!prevEntry.value) {
            window.history.back();
            return null;
        }
        window.history.back();
        
        // Update navigation state
        updateNavigationState(prevEntry.value.index, prevEntry.value.url);
    };

    const goToPrev = () => {
        if(!canGoBack.value || !prevEntry.value) {
            window.history.back();
            return null;
        }
        navigate(prevEntry.value.hash, {state: prevEntry.value.state,});
    };

    const forward = () => {
        if(!canGoForward.value) {
            window.history.forward();
            return null;
        }
        
        const nextIndex = _currentIndex.value + 1;
        const destination = _entries.value[nextIndex];
        
        // Use history.forward to navigate forward
        window.history.forward();
        
        // Update navigation state
        updateNavigationState(nextIndex, destination.url);
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
        updateCurrentEntry,
        goToPrev,
        
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

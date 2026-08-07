import { batch, computed, effect, signal } from '@preact/signals';

import type {
    HashNavigation,
    NavigationHistoryEntry,
    NavigationOptions,
    NavigationState
} from '../types';

import {
    createHash,
    createHistoryEntry,
    getHash
} from '../helpers';

const createInitialState = () => ({
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
    const _entries = signal<NavigationHistoryEntry[]>(initialState.entries);
    const _currentIndex = signal<number>(initialState.index);

    // Storage for active subscriptions
    const _subscriptions = initialState.subscriptions;
    let _createdCount = 0;

    // Public computed signals that reflect the router state
    const currentEntry = computed(() => _entries.value[_currentIndex.value]);
    const entries = computed(() => [..._entries.value]);
    const canGoBack = computed(() => _currentIndex.value > 0);
    const canGoForward = computed(() => _currentIndex.value < _entries.value.length - 1);
    const prevEntry = computed(() => {
        return _currentIndex.value > 0 ? _entries.value[_currentIndex.value - 1] : null;
    });

    // Align the router model with the current location. Used on every create so
    // a host page switch (e.g. react-router pushState) or a popstate that fired
    // while no listener was attached cannot leave the model/index pointing at a
    // stale entry from a previous host page.
    const reconcileFromLocation = (): void => {
        const currentUrl = window.location.href;
        const existingEntryIndex = _entries.value.findIndex((entry) => entry.url === currentUrl);

        // Using batch to update multiple signals at once
        batch(() => {
            if(existingEntryIndex === -1) {
                const newEntries = [..._entries.value];

                // Navigating to an unknown location discards the forward entries
                if(_currentIndex.value < newEntries.length - 1) {
                    newEntries.splice(_currentIndex.value + 1);
                }

                const state = window.history.state as NavigationState | undefined;
                const newEntry = createHistoryEntry(currentUrl, state, newEntries.length);

                newEntries.push(newEntry);
                _entries.value = newEntries;
                _currentIndex.value = newEntries.length - 1;
            }
            else {
                // Reconcile with the preserved model so back/forward across
                // router lifecycles keeps the correct history position
                _currentIndex.value = existingEntryIndex;
            }
        });
    };

    // Helper function to update the current history index
    const updateNavigationState = (newCurrentIndex: number) => {
        _currentIndex.value = newCurrentIndex;
    };

    // Handle hash change events from the window
    const handleHashChange = (event: HashChangeEvent): void => {
        // This is triggered by the browser, so we need to update our state
        const newUrl = event.newURL;

        if(newUrl === currentEntry.value?.url) {
            return;
        }

        const state = window.history.state as NavigationState | undefined;

        // Check if this is a navigation we already know about
        const existingEntryIndex = _entries.value.findIndex((entry) => entry.url === newUrl);

        if(existingEntryIndex === -1) {
            // Otherwise, create a new entry
            const newEntries = [..._entries.value];

            // If we navigated from a point in history, remove the forward entries
            if(_currentIndex.value < _entries.value.length - 1) {
                newEntries.splice(_currentIndex.value + 1);
            }

            const newEntry = createHistoryEntry(newUrl, state, newEntries.length);

            newEntries.push(newEntry);

            // Using batch to update multiple signals at once
            batch(() => {
                _entries.value = newEntries;
                updateNavigationState(newEntries.length - 1);
            });
        }
        else {
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
        }
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
    const updateCurrentEntryHash = (hash: string, newState?: NavigationState | null) => {
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
        if(current) {
            callback(current, prevEntry.value, current.hash);
        }

        // Create an effect that tracks changes in the currentEntry signal
        const unsubscribe = effect(() => {
            const entry = currentEntry.value;

            if(!entry) return;

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
        if(originalHash === hash) {
            // If hash didn't change, check if state changed
            const currentEntryValue = currentEntry.value;

            if(options?.state && JSON.stringify(currentEntryValue.state) !== JSON.stringify(options?.state)) {
                // Update state without changing URL
                replaceHistoryEntry(fullUrl, options?.state as NavigationState);
            }
        }
        else {
            // Update our internal state
            const newEntries = [..._entries.value];

            // If we navigated from a point in history, remove the forward entries
            if(_currentIndex.value < _entries.value.length - 1) {
                newEntries.splice(_currentIndex.value + 1);
            }

            // Create a new destination with state from options
            const destination = createHistoryEntry(fullUrl, options?.state as NavigationState, newEntries.length);

            newEntries.push(destination);

            // Use history pushState to update the URL without reloading
            window.history.pushState(options?.state || null, '', fullUrl);

            // Using batch to update multiple signals at once
            batch(() => {
                _entries.value = newEntries;
                updateNavigationState(newEntries.length - 1);
            });
        }
    };

    const traverseTo = (key: string, options: NavigationOptions = {}) => {
        const entryIndex = _entries.value.findIndex((entry) => entry.key === key);

        if(entryIndex === -1) {
            return;
        }

        const destination = _entries.value[entryIndex];
        const delta = entryIndex - _currentIndex.value;

        // history.go(0) would reload the page, so skip traversal to the current entry
        if(delta === 0) {
            return;
        }

        // Handle potential state update if options include state
        if(options.state) {
            replaceHistoryEntry(destination.url, options.state as NavigationState, entryIndex);
        }

        // Use history.go to navigate through history
        window.history.go(delta);

        // Update navigation state
        updateNavigationState(entryIndex);
    };

    const back = () => {
        if(!prevEntry.value) {
            window.history.back();
            return null;
        }
        window.history.back();

        // Update navigation state
        updateNavigationState(prevEntry.value.index);
    };

    const goToPrev = () => {
        if(!canGoBack.value || !prevEntry.value) {
            window.history.back();
            return null;
        }
        traverseTo(prevEntry.value.key);
    };

    const forward = () => {
        if(!canGoForward.value) {
            window.history.forward();
            return null;
        }

        const nextIndex = _currentIndex.value + 1;

        // Use history.forward to navigate forward
        window.history.forward();

        // Update navigation state
        updateNavigationState(nextIndex);
    };

    const create = () => {
        // Only attach the hashchange listener for the first active instance so
        // concurrent instances share one listener and one model
        if(_createdCount === 0) {
            window.addEventListener('hashchange', handleHashChange);
        }
        _createdCount++;

        // Reconcile with the current location on every create: a host page
        // switch can change the URL between destroy/create (or while other
        // instances stay active), and a stale index would otherwise corrupt
        // the model on the next redirect or navigation
        reconcileFromLocation();
    };

    const destroy = (): void => {
        if(_createdCount > 0) {
            _createdCount--;
        }

        // Tear down only when the last active instance is destroyed
        if(_createdCount > 0) {
            return;
        }

        window.removeEventListener('hashchange', handleHashChange);

        // Cancel all active subscriptions
        _subscriptions.forEach((unsub) => unsub());
        _subscriptions.clear();
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

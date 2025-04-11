import { signal, computed, effect, batch } from '@preact/signals';

import type { 
    NavigationResult, 
    NavigationState, 
    NavigationHistoryEntry, 
    NavigationOptions 
} from '#src/types';

/**
 * Implementation of hash-based router core using Preact signals
 * and following the Navigation API interface, while using window.history for compatibility
 */
export class HashRouterCore {

    // Internal signals to manage router state
    private _currentURL = signal<string>(window.location.href);
    private _entries = signal<NavigationHistoryEntry[]>([this.createHistoryEntry(window.location.href)]);
    private _currentIndex = signal<number>(0);
    private _navigations = signal<Map<string, NavigationResult>>(new Map());
    private _eventListeners = new Map<string, Set<EventListener>>();

    // Public computed signals that reflect the router state
    public currentEntry = computed(() => this._entries.value[this._currentIndex.value]);
  
    public entries = computed(() => [...this._entries.value]);
  
    public canGoBack = computed(() => this._currentIndex.value > 0);
  
    public canGoForward = computed(() => 
        this._currentIndex.value < this._entries.value.length - 1
    );

    constructor() {
    // Initialize router state based on current location
        this.initializeFromLocation();
    
        // Set up window hash change event listener
        window.addEventListener('hashchange', this.handleHashChange.bind(this));
    
        // Set up effect to synchronize URL with current entry
        effect(() => {
            const currentEntry = this.currentEntry.value;

            if(currentEntry && this.getHash(this._currentURL.value) !== this.getHash(currentEntry.url as string)) {
                this._currentURL.value = currentEntry.url as string;
            }
        });
    }

    /**
   * Initialize the router state from the current location
   */
    private initializeFromLocation(): void {
    // Try to get existing state from the history API
        const state = window.history.state;
        const initialEntry = this.createHistoryEntry(window.location.href, state);
    
        // Using batch to update multiple signals at once
        batch(() => {
            this._entries.value = [initialEntry];
            this._currentIndex.value = 0;
            this._currentURL.value = initialEntry.url as string;
        });
    }

    /**
   * Extract hash part from a URL
   */
    private getHash(url: string): string {
        const urlObject = new URL(url);

        return urlObject.hash.slice(1) || '/';
    }

    /**
   * Create a NavigationHistoryEntry object from a URL and optional state
   */
    private createHistoryEntry(url: string, state?: NavigationState, index: number = 0): NavigationHistoryEntry {
        return {
            url,
            key         : Math.random().toString(36).substring(2, 9),
            id          : Math.random().toString(36).substring(2, 9),
            index,
            sameDocument: true,
            state,
            // Implementation of getState method as per the Navigation API
            getState    : function() {
                return this.state;
            },
        };
    }

    /**
   * Handle hash change events from the window
   */
    private handleHashChange(event: HashChangeEvent): void {
    // This is triggered by the browser, so we need to update our state
        const newUrl = event.newURL;
        const state = window.history.state;
    
        // Check if this is a navigation we already know about
        const existingEntryIndex = this._entries.value.findIndex((entry) => entry.url === newUrl);
    
        if(existingEntryIndex >= 0) {
            // If we already have this entry, just update the index
            this._currentIndex.value = existingEntryIndex;
      
            // Update state if it has changed
            const existingEntry = this._entries.value[existingEntryIndex];

            if(JSON.stringify(existingEntry.state) !== JSON.stringify(state)) {
                const updatedEntries = [...this._entries.value];

                updatedEntries[existingEntryIndex] = {
                    ...existingEntry,
                    state,
                };
                this._entries.value = updatedEntries;
            }
        } else {
            // Otherwise, create a new entry
            const newEntry = this.createHistoryEntry(newUrl, state, this._entries.value.length);
            const newEntries = [...this._entries.value];
      
            // If we navigated from a point in history, remove the forward entries
            if(this._currentIndex.value < this._entries.value.length - 1) {
                newEntries.splice(this._currentIndex.value + 1);
            }
      
            newEntries.push(newEntry);
      
            // Using batch to update multiple signals at once
            batch(() => {
                this._entries.value = newEntries;
                this._currentIndex.value = newEntries.length - 1;
            });
        }

        // Dispatch navigate event
        this.dispatchNavigateEvent();
    }

    /**
   * Create and dispatch a custom navigate event
   */
    private dispatchNavigateEvent(): void {
        const currentDestination = this.currentEntry.value;
    
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
        this.dispatchEvent('navigate', event);
    }

    /**
   * Creates a navigation result with promises that resolve when navigation completes
   */
    private createNavigationResult(destination: NavigationHistoryEntry): NavigationResult {
        let commitResolve: (value: NavigationHistoryEntry) => void;
        let finishResolve: (value: NavigationHistoryEntry) => void;
    
        const committed = new Promise<NavigationHistoryEntry>((resolve) => {
            commitResolve = resolve;
        });
    
        const finished = new Promise<NavigationHistoryEntry>((resolve) => {
            finishResolve = resolve;
        });
    
        // Use setTimeout to simulate the async nature of navigation
        setTimeout(() => commitResolve(destination), 0);
        setTimeout(() => finishResolve(destination), 10);
    
        return { committed, finished, };
    }

    /**
   * Navigate to a specified URL
   */
    public navigate(url: string, options: NavigationOptions = {}): NavigationResult {
    // Create full URL by resolving against current location
        const fullUrl = new URL(url, window.location.href).href;
        const originalHash = this.getHash(this._currentURL.value);
        const newHash = this.getHash(fullUrl);
    
        // Only navigate if the hash part actually changed
        if(originalHash !== newHash) {
            // Create a new destination with state from options
            const destination = this.createHistoryEntry(fullUrl, options.state as NavigationState, this._entries.value.length);
      
            // Use history pushState to update the URL without reloading
            window.history.pushState(options.state || null, '', `#${newHash}`);
      
            // Update our internal state
            const newEntries = [...this._entries.value];
      
            // If we navigated from a point in history, remove the forward entries
            if(this._currentIndex.value < this._entries.value.length - 1) {
                newEntries.splice(this._currentIndex.value + 1);
            }
      
            newEntries.push(destination);
      
            // Create a navigation result
            const result = this.createNavigationResult(destination);
      
            // Store the navigation for potential future reference
            const navigations = new Map(this._navigations.value);

            navigations.set(destination.key, result);
      
            // Using batch to update multiple signals at once
            batch(() => {
                this._entries.value = newEntries;
                this._currentIndex.value = newEntries.length - 1;
                this._currentURL.value = fullUrl;
                this._navigations.value = navigations;
            });
      
            // Dispatch navigate event
            this.dispatchNavigateEvent();
      
            return result;
        } else {
            // If hash didn't change, check if state changed
            const currentEntry = this.currentEntry.value;

            if(options.state && JSON.stringify(currentEntry.state) !== JSON.stringify(options.state)) {
                // Update state without changing URL
                window.history.replaceState(options.state, '', `#${newHash}`);
        
                const updatedEntry = { 
                    ...currentEntry,
                    state: options.state,
                };
        
                const newEntries = [...this._entries.value];

                newEntries[this._currentIndex.value] = updatedEntry;
        
                this._entries.value = newEntries;
        
                // Create and return a navigation result for the updated entry
                return this.createNavigationResult(updatedEntry);
            }
      
            // If nothing changed, return a result that resolves immediately with current entry
            return this.createNavigationResult(currentEntry);
        }
    }

    /**
   * Navigate to a specified delta in the history
   */
    public traverseTo(key: string, options: NavigationOptions = {}): NavigationResult | null {
        const entryIndex = this._entries.value.findIndex((entry) => entry.key === key);
    
        if(entryIndex === -1) {
            return null;
        }
    
        const destination = this._entries.value[entryIndex];
        const delta = entryIndex - this._currentIndex.value;
    
        // Handle potential state update if options include state
        if(options.state) {
            // Create updated destination with new state
            const updatedDestination = {
                ...destination,
                state: options.state,
            };
      
            // Update our entries array
            const newEntries = [...this._entries.value];

            newEntries[entryIndex] = updatedDestination;
            this._entries.value = newEntries;
      
            // Update history state
            window.history.replaceState(options.state, '', destination.url);
      
            // Use history.go to navigate through history
            window.history.go(delta);
      
            // Create a navigation result
            const result = this.createNavigationResult(updatedDestination);
      
            // Store the navigation for potential future reference
            const navigations = new Map(this._navigations.value);

            navigations.set(updatedDestination.key, result);
      
            // Using batch to update multiple signals at once
            batch(() => {
                this._currentIndex.value = entryIndex;
                this._currentURL.value = updatedDestination.url;
                this._navigations.value = navigations;
            });
      
            return result;
        } else {
            // Use history.go to navigate through history without state changes
            window.history.go(delta);
      
            // Create a navigation result
            const result = this.createNavigationResult(destination);
      
            // Store the navigation for potential future reference
            const navigations = new Map(this._navigations.value);

            navigations.set(destination.key, result);
      
            // Using batch to update multiple signals at once
            batch(() => {
                this._currentIndex.value = entryIndex;
                this._currentURL.value = destination.url;
                this._navigations.value = navigations;
            });
      
            return result;
        }
    }

    /**
   * Go back in history
   */
    public back(options: NavigationOptions = {}): NavigationResult | null {
        if(!this.canGoBack.value) {
            return null;
        }
    
        const prevIndex = this._currentIndex.value - 1;
        const destination = this._entries.value[prevIndex];
    
        // Handle potential state update if options include state
        if(options.state) {
            // Create updated destination with new state
            const updatedDestination = {
                ...destination,
                state: options.state,
            };
      
            // Update our entries array
            const newEntries = [...this._entries.value];

            newEntries[prevIndex] = updatedDestination;
            this._entries.value = newEntries;
      
            // Update history state before going back
            window.history.replaceState(options.state, '', destination.url);
        }
    
        // Use history.back to navigate back
        window.history.back();
    
        // Get the possibly updated destination
        const updatedDestination = this._entries.value[prevIndex];
    
        // Create a navigation result
        const result = this.createNavigationResult(updatedDestination);
    
        // Store the navigation for potential future reference
        const navigations = new Map(this._navigations.value);

        navigations.set(updatedDestination.key, result);
    
        // Using batch to update multiple signals at once
        batch(() => {
            this._currentIndex.value--;
            this._currentURL.value = updatedDestination.url;
            this._navigations.value = navigations;
        });
    
        return result;
    }

    /**
   * Go forward in history
   */
    public forward(options: NavigationOptions = {}): NavigationResult | null {
        if(!this.canGoForward.value) {
            return null;
        }
    
        const nextIndex = this._currentIndex.value + 1;
        const destination = this._entries.value[nextIndex];
    
        // Handle potential state update if options include state
        if(options.state) {
            // Create updated destination with new state
            const updatedDestination = {
                ...destination,
                state: options.state,
            };
      
            // Update our entries array
            const newEntries = [...this._entries.value];

            newEntries[nextIndex] = updatedDestination;
            this._entries.value = newEntries;
      
            // Update history state before going forward
            window.history.replaceState(options.state, '', destination.url);
        }
    
        // Use history.forward to navigate forward
        window.history.forward();
    
        // Get the possibly updated destination
        const updatedDestination = this._entries.value[nextIndex];
    
        // Create a navigation result
        const result = this.createNavigationResult(updatedDestination);
    
        // Store the navigation for potential future reference
        const navigations = new Map(this._navigations.value);

        navigations.set(updatedDestination.key, result);
    
        // Using batch to update multiple signals at once
        batch(() => {
            this._currentIndex.value++;
            this._currentURL.value = updatedDestination.url;
            this._navigations.value = navigations;
        });
    
        return result;
    }

    /**
   * Reload the current page
   */
    public reload(options: NavigationOptions = {}): NavigationResult {
        const currentEntry = this.currentEntry.value;
    
        // Create a new destination to represent the reload, potentially with updated state
        const state = options.state !== undefined ? options.state : currentEntry.state;
        const destination = this.createHistoryEntry(currentEntry.url, state, currentEntry.index);
    
        // Update history state if new state is provided
        if(options.state !== undefined) {
            window.history.replaceState(options.state, '', currentEntry.url);
      
            // Update the entry in our entries array
            const entries = [...this._entries.value];

            entries[this._currentIndex.value] = destination;
            this._entries.value = entries;
        }
    
        // Actually reload the current hash route
        window.location.hash = this.getHash(currentEntry.url);
    
        // Create a navigation result
        const result = this.createNavigationResult(destination);
    
        // Store the navigation for potential future reference
        const navigations = new Map(this._navigations.value);

        navigations.set(destination.key, result);
    
        // Update navigations signal
        this._navigations.value = navigations;
    
        return result;
    }

    /**
   * Update the current entry's state
   */
    public updateCurrentEntry(options: NavigationOptions = {}): void {
        const currentIndex = this._currentIndex.value;
        const entries = [...this._entries.value];
        const currentEntry = entries[currentIndex];
    
        // Update the history state
        window.history.replaceState(options.state || null, '', window.location.hash);
    
        // Create a new entry with the updated state
        const updatedEntry = {
            ...currentEntry,
            state: options.state || null,
        };
    
        // Update the entries
        entries[currentIndex] = updatedEntry;
        this._entries.value = entries;
    }

    /**
   * Add an event listener
   */
    public addEventListener(type: string, listener: EventListener): void {
        if(!this._eventListeners.has(type)) {
            this._eventListeners.set(type, new Set());
        }
        this._eventListeners.get(type)?.add(listener);
    }

    /**
   * Remove an event listener
   */
    public removeEventListener(type: string, listener: EventListener): void {
        if(this._eventListeners.has(type)) {
            this._eventListeners.get(type)?.delete(listener);
        }
    }

    /**
   * Dispatch an event to all registered listeners
   */
    private dispatchEvent(type: string, event: Event): void {
        if(this._eventListeners.has(type)) {
            const listeners = this._eventListeners.get(type);

            if(listeners) {
                listeners.forEach((listener) => listener(event));
            }
        }
    }

    /**
   * Clean up resources when the router is no longer needed
   */
    public destroy(): void {
        window.removeEventListener('hashchange', this.handleHashChange.bind(this));
        this._eventListeners.clear();
    }

}

// Export a singleton instance for convenience
export const hashRouter = new HashRouterCore();
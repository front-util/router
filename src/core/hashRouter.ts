import { createHash, getParamsFromUrl, getRouteItem, getRouteMap, parseQueryParams } from '#src/helpers';
import { computed } from '@preact/signals';
import { 
    HashNavigation, 
    HashRouter, 
    InitializeRouterConfig, 
    NavigationCb, 
    NavigationHistoryEntry, 
    QueryParams, 
    SubscribeChangeConfig 
} from '../types';
import { createHashNavigation } from './hashNavigation';

/**
 * Creates a hash-based router that implements the HashRouter interface
 * @param createNavigation - The function create navigation object to use for routing operations
 * @returns An object implementing the HashRouter interface
 */
export const createHashRouter = (hashNavigation: HashNavigation): HashRouter => {
    // Store the router configuration
    let routerConfig: InitializeRouterConfig | null = null;

    /**
     * Checks if a hash exists in the configured route names
     * @param hash - The hash to check
     * @returns boolean indicating if the hash exists in routes
     */
    const checkExistPage = (hash: string): boolean => {
        if(!routerConfig) return false;
    
        // Remove the leading '#' if present for comparison
        const normalizedHash = hash.startsWith('#') ? hash.substring(1) : hash;

        return routerConfig.routeNames.includes(normalizedHash);
    };

    const getNavigationStatus = (hash: string) => checkExistPage(hash) ? 'success' : 'notfound';

    /**
     * Helper function to subscribe to navigation events
     * @param navigation - The navigation object
     * @param callback - Function to call when navigation occurs
     * @returns A function to unsubscribe the listener
     */
    const subscribeToNavigationEvents = (
        callback: NavigationCb
    ): VoidFunction => {
        // Use the new subscribe method instead of events
        return hashNavigation.subscribe((entry, prevEntry, hash) => {
            callback(entry, prevEntry, getNavigationStatus(hash));
        });
    };

    /**
     * Replaces the current state and/or hash
     * @param config - Optional configuration for the state replacement
     */
    const replaceState = (config?: { state?: Record<string, unknown>; hash?: string }): void => {        
        if(!config) return;    
        const currentEntry = hashNavigation.currentEntry.value;
    
        if(config.state) {
            hashNavigation.updateCurrentEntry(config.state);
        }
    
        if(config.hash && config.hash !== currentEntry.hash) {
            hashNavigation.navigate(config.hash, { 
                state: config.state || currentEntry.state,
            });
        }
    };

    /**
     * Creates the router and subscribes to location changes
     * @param config - Configuration containing onChange handler and router setup
     * @returns A function to unsubscribe the listener
     */
    const create = (config: SubscribeChangeConfig): VoidFunction => {
        const { onChange, config: initConfig, } = config;

        // Set initial home as initial hash if it empty
        if(!window.location.hash && initConfig.homeUrl) {            
            window.location.hash = `#${createHash(initConfig.homeUrl)}`;
            hashNavigation.updateCurrentEntryHash(initConfig.homeUrl);
        }
  
        // Store the configuration for future use
        routerConfig = initConfig;
  
        let prevLocation: NavigationHistoryEntry | null = null;

        hashNavigation.create();
  
        // Subscribe to navigation events
        const unsubscribe = subscribeToNavigationEvents(
            (entry, prevEntry, navigationStatus) => {
                // Only trigger onChange if this is a different location                
                if(!prevLocation || prevLocation.url !== entry.url) {                    
                    onChange(entry, prevEntry, navigationStatus);
                    prevLocation = entry;
                }
            }
        );
  
        // Check current hash
        const currentHash = hashNavigation.currentEntry.value.hash;
        
        // If current hash is empty, navigate to home URL
        if(currentHash && !checkExistPage(currentHash) && routerConfig.homeUrl) {
            // Replace the current history entry with the home URL
            replaceState({ hash: routerConfig.homeUrl, });
        }
  
        return unsubscribe;
    };

    /**
     * Subscribes to history changes
     * @param callback - Function to call when location changes
     * @returns A function to unsubscribe the listener
     */
    const subscribe = (callback: NavigationCb): VoidFunction => {
        return subscribeToNavigationEvents(callback);
    };

    /**
     * Navigates to a specific hash
     * @param hash - The hash to navigate to
     * @param state - Optional state to associate with this navigation
     */
    const navigate = (hash: string, state?: Record<string, unknown>) => {
        return hashNavigation.navigate(hash, { state, });
    };

    /**
     * Navigates back in history
     */
    const goBack = (): void => {
        hashNavigation.back();
    };

    /**
     * Alias for goBack
     */
    const goToPrev = (): void => {
        hashNavigation.back();
    };

    /**
     * Checks if a page exists by hash in the routes provided during initialization
     * @param hash - Optional hash to check (uses current hash if not provided)
     * @returns boolean indicating if the page exists in the configured routes
     */
    const hasPage = (hash?: string): boolean => {
        const hashToCheck = hash || hashNavigation.currentEntry.value.hash;

        return checkExistPage(hashToCheck);
    };

    const getHash = () => hashNavigation.currentEntry.value.hash;

    const getState = () => hashNavigation.currentEntry.value.state;

    const destroy = () => hashNavigation.destroy();

    const getConfig = () => routerConfig;

    const currentEntry = computed(() => {
        const entry = hashNavigation.currentEntry.value;
        const hash = entry.hash;
        const pattern = getRouteItem(getRouteMap(routerConfig?.routeNames ?? []), hash);

        return {
            ...entry,
            pattern,
            getParams: <T>() => pattern ? getParamsFromUrl(pattern, hash) as T : {} as T,
            getQuery : <T extends QueryParams>() => parseQueryParams<T>(hash),
        };
    });

    const state = computed(() => currentEntry.value.state);

    const hash = computed(() => currentEntry.value.hash);

    // Return the router object with references to the functions defined in the closure
    return {
        _navigation : hashNavigation,
        entries     : hashNavigation.entries,
        currentEntry,
        state,
        hash,
        canGoBack   : hashNavigation.canGoBack,
        canGoForward: hashNavigation.canGoForward,
        getHash,
        getState,
        create,
        subscribe,
        navigate,
        replaceState,
        goBack,
        goToPrev,
        hasPage,
        destroy,
        getConfig,
    };
};

export const hashRouter = createHashRouter(createHashNavigation());

import { 
    HashNavigation, 
    HashRouter, 
    InitializeRouterConfig, 
    NavigationHistoryEntry, 
    SubscribeChangeConfig 
} from '../types';
import { hashNavigation as navigator } from './hashNavigation';

/**
 * Helper function to subscribe to navigation events
 * @param navigation - The navigation object
 * @param callback - Function to call when navigation occurs
 * @returns A function to unsubscribe the listener
 */
const subscribeToNavigationEvents = (
    navigation: HashNavigation,
    callback: (entry: NavigationHistoryEntry, prev?: NavigationHistoryEntry | null) => void
): VoidFunction => {
    let prevLocation: NavigationHistoryEntry | null = null;

    const handleNavigate = (event: Event) => {
        const navEvent = event as unknown as { entry: NavigationHistoryEntry };
        const currentEntry = navEvent.entry || navigation.currentEntry.value;
  
        callback(currentEntry, prevLocation);
        prevLocation = currentEntry;
    };

    // Initial call with current entry
    callback(navigation.currentEntry.value);
    prevLocation = navigation.currentEntry.value;

    // Subscribe to navigate events
    navigation.addEventListener('navigate', handleNavigate);

    // Return unsubscribe function
    return () => {
        navigation.removeEventListener('navigate', handleNavigate);
    };
};

/**
 * Creates a hash-based router that implements the HashRouter interface
 * @param hashNavigation - The navigation object to use for routing operations
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
    
        if(config.hash && config.hash !== currentEntry.getHash()) {
            hashNavigation.navigate(config.hash, { 
                state: config.state || currentEntry.getState(),
            });
        }
    };

    /**
     * Initializes the router and subscribes to location changes
     * @param config - Configuration containing onChange handler and router setup
     * @returns A function to unsubscribe the listener
     */
    const initializeAndSubscribeOnChange = (config: SubscribeChangeConfig): VoidFunction => {
        const { onChange, config: initConfig, } = config;
  
        // Store the configuration for future use
        routerConfig = initConfig;
  
        let prevLocation: NavigationHistoryEntry | null = null;
  
        // Subscribe to navigation events
        const unsubscribe = subscribeToNavigationEvents(
            hashNavigation,
            (entry) => {
                // Only trigger onChange if this is a different location
                if(!prevLocation || prevLocation.url !== entry.url) {
                    onChange(entry);
                    prevLocation = entry;
                }
            }
        );
  
        // Check current hash
        const currentHash = hashNavigation.currentEntry.value.getHash();
  
        // If current hash is empty, navigate to home URL
        if(!currentHash && routerConfig.homeUrl) {
            hashNavigation.navigate(routerConfig.homeUrl);
        } 
        // If current hash doesn't exist in route names, replace with home URL
        else if(currentHash && !checkExistPage(currentHash) && routerConfig.homeUrl) {
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
    const subscribeOnListenHistory = (callback: (update: NavigationHistoryEntry, prevLocation?: NavigationHistoryEntry | null) => void): VoidFunction => {
        return subscribeToNavigationEvents(hashNavigation, callback);
    };

    /**
     * Navigates to a specific hash
     * @param hash - The hash to navigate to
     * @param state - Optional state to associate with this navigation
     */
    const navigate = (hash: string, state?: Record<string, unknown>): void => {
        hashNavigation.navigate(hash, { state, });
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
    const isExistPageByCurrentHash = (hash?: string): boolean => {
        const hashToCheck = hash || hashNavigation.currentEntry.value.getHash();

        return checkExistPage(hashToCheck);
    };

    // Return the router object with references to the functions defined in the closure
    return {
        navigation: hashNavigation,
        initializeAndSubscribeOnChange,
        subscribeOnListenHistory,
        navigate,
        replaceState,
        goBack,
        goToPrev,
        isExistPageByCurrentHash,
    };
};

export const hashRouter = createHashRouter(navigator);

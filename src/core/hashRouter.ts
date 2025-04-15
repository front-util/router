import { createHash } from '#src/helpers';
import { 
    HashNavigation, 
    HashRouter, 
    InitializeRouterConfig, 
    NavigationHistoryEntry, 
    SubscribeChangeConfig 
} from '../types';
import { createHashNavigation } from './hashNavigation';

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
 * @param createNavigation - The function create navigation object to use for routing operations
 * @returns An object implementing the HashRouter interface
 */
export const createHashRouter = (createNavigation: () => HashNavigation): HashRouter => {
    // Store the router configuration
    let routerConfig: InitializeRouterConfig | null = null;
    let _hashNavigation: null | HashNavigation = null;

    const getNavigation = () => {
        if(!_hashNavigation) {
            _hashNavigation = createNavigation();
        }
        return _hashNavigation;
    };

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
        console.log('%c replace', 'background: #222; color: #bada55', '');
        
        if(!config) return;
        const hashNavigation = getNavigation();
    
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
     * Creates the router and subscribes to location changes
     * @param config - Configuration containing onChange handler and router setup
     * @returns A function to unsubscribe the listener
     */
    const create = (config: SubscribeChangeConfig): VoidFunction => {
        const { onChange, config: initConfig, } = config;

        // Set initial home as initial hash if it empty
        if(!window.location.hash && initConfig.homeUrl) {
            window.location.hash = `#${createHash(initConfig.homeUrl)}`;
        }
  
        // Store the configuration for future use
        routerConfig = initConfig;
        _hashNavigation = createNavigation();
  
        let prevLocation: NavigationHistoryEntry | null = null;
  
        // Subscribe to navigation events
        const unsubscribe = subscribeToNavigationEvents(
            _hashNavigation,
            (entry) => {
                // Only trigger onChange if this is a different location
                console.log('%c lllll', 'background: #222; color: #bada55', prevLocation, entry);
                
                if(!prevLocation || prevLocation.url !== entry.url) {
                    onChange(entry);
                    prevLocation = entry;
                }
            }
        );
  
        // Check current hash
        const currentHash = _hashNavigation.currentEntry.value.getHash();
        
        // If current hash is empty, navigate to home URL
        if(currentHash && !checkExistPage(currentHash) && routerConfig.homeUrl) {
            console.log('%c 111', 'background: #222; color: #bada55', currentHash);

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
    const subscribe = (callback: (update: NavigationHistoryEntry, prevLocation?: NavigationHistoryEntry | null) => void): VoidFunction => {
        return subscribeToNavigationEvents(getNavigation(), callback);
    };

    /**
     * Navigates to a specific hash
     * @param hash - The hash to navigate to
     * @param state - Optional state to associate with this navigation
     */
    const navigate = (hash: string, state?: Record<string, unknown>): void => {
        getNavigation().navigate(hash, { state, });
    };

    /**
     * Navigates back in history
     */
    const goBack = (): void => {
        getNavigation().back();
    };

    /**
     * Alias for goBack
     */
    const goToPrev = (): void => {
        getNavigation().back();
    };

    /**
     * Checks if a page exists by hash in the routes provided during initialization
     * @param hash - Optional hash to check (uses current hash if not provided)
     * @returns boolean indicating if the page exists in the configured routes
     */
    const hasPage = (hash?: string): boolean => {
        const hashToCheck = hash || getNavigation().currentEntry.value.getHash();

        return checkExistPage(hashToCheck);
    };

    const getHash = () => getNavigation().currentEntry.value.getHash();

    const getState = () => getNavigation().currentEntry.value.getState();

    // Return the router object with references to the functions defined in the closure
    return {
        navigation: _hashNavigation ?? getNavigation(),
        create,
        subscribe,
        navigate,
        replaceState,
        goBack,
        goToPrev,
        hasPage,
        getHash,
        getState,
    };
};

export const hashRouter = createHashRouter(createHashNavigation);

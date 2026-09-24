import { computed } from '@preact/signals';

import { getParamsFromUrl, getRouteItem, getRouteMap, getUrlFromPattern, parseQueryParams } from '../helpers';
import {
    HashNavigation,
    HashRouter,
    InitializeRouterConfig,
    NavigationCb,
    NavigationHistoryEntry,
    NavigationState,
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
    let subscription: VoidFunction | null = null;

    // Statuses last delivered to standalone subscribers created via
    // subscribe(), keyed by the exact history entry they refer to. create()
    // re-emits an accurate status once the router config is applied, so a
    // subscriber attached before any create() transitions from notStarted even
    // when the current entry itself does not change (valid deep-link launch).
    const standaloneDeliveries = new Map<NavigationCb, { status: string; entry: NavigationHistoryEntry; }>();

    /**
     * Checks if a hash exists in the configured route names
     * @param hash - The hash to check
     * @returns boolean indicating if the hash exists in routes
     */
    const isPageExists = (hash: string): boolean => {
        if(!routerConfig) return false;

        // Remove the leading '#' if present for comparison
        const normalizedHash = hash.startsWith('#') ? hash.substring(1) : hash;
        const pattern = getRouteItem(getRouteMap(routerConfig?.routeNames ?? []), normalizedHash);

        return !!pattern;
    };

    const getNavigationStatus = (hash: string) => {
        // Without a configured route set the router does not know yet whether
        // a hash exists, so the router is "not started". Standalone
        // subscribers receive this status on their initial synchronous call,
        // which often fires before any create()/ClientRouter run, and are
        // re-emitted with an accurate status once create() sets the config.
        if(!routerConfig) return 'notStarted';

        return isPageExists(hash) ? 'success' : 'notfound';
    };

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
     * Re-emits the current navigation status to standalone subscribers whose
     * delivered status is stale for the still-current entry (e.g. notStarted
     * before the first config was applied). Both the status AND the entry must
     * match the last delivery to avoid duplicates: when the redirect changed
     * the entry, the normal hashNavigation effect already delivers the fresh
     * status, so the refresh must stay silent.
     */
    const refreshStandaloneStatuses = (): void => {
        const entry = hashNavigation.currentEntry.value;

        if(!entry) return;

        const status = getNavigationStatus(entry.hash);

        standaloneDeliveries.forEach((delivered, callback) => {
            if(delivered.entry !== entry || delivered.status === status) return;

            standaloneDeliveries.set(callback, { status, entry: entry, });
            callback(entry, hashNavigation.prevEntry.value, status);
        });
    };

    /**
     * Replaces the current state and/or hash
     * @param config - Optional configuration for the state replacement
     */
    const replaceState = (config?: { state?: Record<string, unknown>; hash?: string; }): void => {
        if(!config) return;

        const currentEntry = hashNavigation.currentEntry.value;

        if(config.hash && config.hash !== currentEntry.hash) {
            hashNavigation.updateCurrentEntryHash(config.hash, config.state || (currentEntry.state as NavigationState));
            return;
        }

        if(config.state) {
            hashNavigation.updateCurrentEntry({ state: config.state, });
        }
    };

    /**
     * Creates the router and subscribes to location changes
     * @param config - Configuration containing onChange handler and router setup
     * @returns A function to unsubscribe the listener
     */
    const create = (config: SubscribeChangeConfig): VoidFunction => {
        const { onChange, config: initConfig, } = config;

        // Store the configuration for future use
        routerConfig = initConfig;

        // Cancel any previous subscription so a repeated create without
        // destroy does not duplicate onChange calls
        if(subscription) {
            subscription();
            subscription = null;
        }

        hashNavigation.create();

        // Redirect to home when the current hash is empty or not a configured
        // route. Runs before subscribing so onChange fires exactly once.
        const currentHash = hashNavigation.currentEntry.value.hash;

        if(!currentHash || !isPageExists(currentHash)) {
            hashNavigation.updateCurrentEntryHash(initConfig.homeUrl);
        }

        let prevLocation: NavigationHistoryEntry | null = null;

        // Subscribe to navigation events
        const unsubscribe = subscribeToNavigationEvents(
            (entry, prevEntry, navigationStatus) => {
                // Only trigger onChange if this is a different location
                if(prevLocation && prevLocation.url === entry.url) {
                    return;
                }

                onChange(entry, prevEntry, navigationStatus);
                prevLocation = entry;
            }
        );

        subscription = unsubscribe;

        // The config is applied: standalone subscribers that attached before
        // the router started (status notStarted) now get an accurate status
        // for the current entry, even when no navigation happened (valid
        // deep-link first launch does not change the entry).
        refreshStandaloneStatuses();

        return unsubscribe;
    };

    /**
     * Subscribes to history changes
     * @param callback - Function to call when location changes
     * @returns A function to unsubscribe the listener
     */
    const subscribe = (callback: NavigationCb): VoidFunction => {
        // Record the last delivered status+entry per subscriber so
        // refreshStandaloneStatuses() can detect staleness after create()
        const wrapped: NavigationCb = (entry, prevEntry, navigationStatus) => {
            standaloneDeliveries.set(callback, { status: navigationStatus, entry, });
            callback(entry, prevEntry, navigationStatus);
        };

        const unsubscribe = subscribeToNavigationEvents(wrapped);

        return () => {
            standaloneDeliveries.delete(callback);
            unsubscribe();
        };
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
     * Navigates to a route pattern substituting params into the URL
     * @param pattern - The route pattern, e.g. '/user/:category/:id'
     * @param params - Optional object of params to substitute, e.g. { category: 5, id: 10 }
     * @param state - Optional state to associate with this navigation
     */
    const navigateTo = (
        pattern: string,
        params?: Record<string, string | number>,
        state?: Record<string, unknown>
    ) => {
        return navigate(getUrlFromPattern(pattern, params), state);
    };

    /**
     * Navigates back in history
     */
    const goBack = (): void => {
        hashNavigation.back();
    };

    const goToPrev = (): void => {
        hashNavigation.goToPrev();
    };

    /**
     * Checks if a page exists by hash in the routes provided during initialization
     * @param hash - Optional hash to check (uses current hash if not provided)
     * @returns boolean indicating if the page exists in the configured routes
     */
    const hasPage = (hash?: string): boolean => {
        const hashToCheck = hash || hashNavigation.currentEntry.value.hash;

        return isPageExists(hashToCheck);
    };

    const getHash = () => hashNavigation.currentEntry.value.hash;

    const getState = <T>() => hashNavigation.currentEntry.value.state as T;

    const destroy = () => {
        if(subscription) {
            subscription();
            subscription = null;
        }
        // Release standalone subscriber bookkeeping so the router config
        // references are not retained after teardown
        standaloneDeliveries.clear();
        hashNavigation.destroy();
    };

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

    const state = computed(() => hashNavigation.currentEntry.value.state as NavigationState);

    const hash = computed(() => hashNavigation.currentEntry.value.hash);

    // Return the router object with references to the functions defined in the closure
    return {
        _navigation : hashNavigation,
        entries     : hashNavigation.entries,
        prevEntry   : hashNavigation.prevEntry,
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
        navigateTo,
        replaceState,
        goBack,
        goToPrev,
        hasPage,
        destroy,
        getConfig,
    };
};

export const hashRouter = createHashRouter(createHashNavigation());

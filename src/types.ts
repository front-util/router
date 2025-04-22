/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReadonlySignal } from "@preact/signals";

export type NavigationState = Record<string, unknown>;

export interface QueryParams {
  [key: string]: string
}

/**
 * Interface for NavigationHistoryEntry based on the Navigation API
 */
export interface NavigationHistoryEntry {
    url: string;
    key: string;
    id: string;
    index: number;
    sameDocument: boolean;
    // State storage for entries
     
    state?: any;
    hash: string;
  }
  
/**
   * Interface for NavigationResult based on the Navigation API
   */
export interface NavigationResult {
    committed: Promise<NavigationHistoryEntry>;
    finished: Promise<NavigationHistoryEntry>;
  }
  
/**
   * Simplified NavigateEvent interface based on the Navigation API
   */
export interface NavigateEvent extends Event {
    destination: NavigationHistoryEntry;
    canIntercept: boolean;
    intercept: (options?: { handler?: () => Promise<void> | void }) => void;
    scroll: () => void;
  }
  
/**
   * NavigationOptions interface based on the Navigation API
   */
export interface NavigationOptions {
    state?: unknown;
    info?: unknown;
}

export interface HashNavigation {
  // Public signals
  currentEntry: ReadonlySignal<NavigationHistoryEntry>;
  prevEntry: ReadonlySignal<NavigationHistoryEntry | null>;
  entries: ReadonlySignal<NavigationHistoryEntry[]>;
  canGoBack: ReadonlySignal<boolean>;
  canGoForward: ReadonlySignal<boolean>;
  
  // Navigation methods
  navigate: (hash: string, options?: NavigationOptions) => NavigationResult;
  traverseTo: (key: string, options?: NavigationOptions) => NavigationResult | null;
  back: (options?: NavigationOptions) => NavigationResult | null;
  forward: (options?: NavigationOptions) => NavigationResult | null;
  reload: (options?: NavigationOptions) => NavigationResult;
  updateCurrentEntry: (options?: NavigationOptions, hash?: string) => void;
  
  // Subscription method
  subscribe: (
    callback: (
      entry: NavigationHistoryEntry,
      prevEntry: NavigationHistoryEntry | null,
      hash: string
    ) => void
  ) => VoidFunction;
  
  // Init
  create: () => void;
  // Cleanup
  destroy: () => void;

  updateCurrentEntryHash: (hash: string) => void;
}

/**
 * router interfaces
 */
export interface InitializeRouterConfig {
  homeUrl: string;
  routeNames: string[];
}

export type NavigationCb = (entry: NavigationHistoryEntry, prev: NavigationHistoryEntry | null, navigationStatus: 'success' | 'notfound') => void;

export interface SubscribeChangeConfig {
  onChange: NavigationCb;
  config: InitializeRouterConfig;
}

export interface RouterHistoryEntry extends NavigationHistoryEntry {
  pattern?: string;
  getParams: <T extends Record<string, string> = Record<string, string>>() => T;
  getQuery : <T extends QueryParams>() => T,
}

export interface HashRouter extends Pick<HashNavigation, 'entries' | 'canGoBack' | 'canGoForward'> {
  _navigation: HashNavigation;
  currentEntry: ReadonlySignal<RouterHistoryEntry>;
  prevEntry: ReadonlySignal<NavigationHistoryEntry | null>;
  state: ReadonlySignal<NavigationState>;
  hash: ReadonlySignal<string>;
  create: (config: SubscribeChangeConfig) => VoidFunction;
  subscribe: (callback: NavigationCb) => VoidFunction;
  navigate: (hash: string, state?: Record<string, unknown>) => NavigationResult;
  replaceState : (config?: {state?: Record<string, unknown>; hash?: string;}) => void;
  goBack: VoidFunction;
  goToPrev: VoidFunction;
  getHash: () => string;
  getState: <T = NavigationState>() => T | undefined;
  hasPage: (hash?: string) => boolean;
  destroy: VoidFunction;
  getConfig: () => InitializeRouterConfig | null;
}

export type RouteComponent = React.ComponentType<any>;

export interface ClientRouterProps {
    className?: string;
    /** Instance of the hash router */
    router: HashRouter;
    /** Map of route paths to React components */
    routes: Map<string, RouteComponent>;
    homeUrl: string;
    /** Component to render when route is not found */
    notFoundComponent: RouteComponent;
}
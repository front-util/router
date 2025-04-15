import { ReadonlySignal } from "@preact/signals";

export type NavigationState = Record<string, unknown>;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state?: any;
    // Method to retrieve the state
    getState<T extends NavigationState = NavigationState>(): T | undefined;
    getHash(): string;
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
  
  // Event handlers
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
  
  // Cleanup
  destroy: () => void;
}

/**
 * router interfaces
 */
export interface InitializeRouterConfig {
  homeUrl: string;
  routeNames: string[];
}

export interface SubscribeChangeConfig {
  onChange: (loc: NavigationHistoryEntry) => void;
  config: InitializeRouterConfig;
}

export interface HashRouter {
  navigation: HashNavigation;
  create: (config: SubscribeChangeConfig) => VoidFunction;
  subscribe: (callback: (update: NavigationHistoryEntry, prevLocation?: NavigationHistoryEntry | null) => void) => VoidFunction;
  navigate: (hash: string, state?: Record<string, unknown>) => void;
  replaceState : (config?: {state?: Record<string, unknown>; hash?: string;}) => void;
  goBack: VoidFunction;
  goToPrev: VoidFunction;
  getHash: () => string;
  getState: () => NavigationState | undefined;
  hasPage: (hash?: string) => boolean;
}

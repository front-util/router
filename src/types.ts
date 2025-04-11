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

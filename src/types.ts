export interface RouterPath {
    pathname: string;
    search: string;
    hash: string;
}

export interface HistoryLocation extends RouterPath {
    state: unknown;
    key: string;
}

export type RouteAction = 'POP' | 'PUSH' | 'REPLACE';

export interface RouterUpdate {
    /**
     * The action that triggered the change.
     */
    action: RouteAction;
    location: HistoryLocation;
}

export type RouteTo = string | Partial<RouterPath>;

export type Listener = (update: RouterUpdate) => void;

export interface RouterHistory {
    location: HistoryLocation;
    push(to: RouteTo, state?: unknown): void;
    replace(to: RouteTo, state?: unknown): void;
    go(delta: number): void;
    back(): void;
    forward(): void;
    listen(listener: Listener): () => void;
}

export interface InitializeRouterConfig {
    homeUrl: string;
    routeNames: string[];
}

export interface SubscribeChangeConfig {
    onChange: (loc: RouterLocation) => void;
    config: InitializeRouterConfig;
    externalHistory?: RouterHistory;
}

export type QuerySet = Record<string, string>;

export interface RouterLocation extends HistoryLocation {
    query?: QuerySet | null;
}

export interface HistoryState {
    history: RouterHistory;
    location: RouterLocation | null;
    prevLocation: RouterLocation | null;
    historyIndex: number;
}

export interface CoreRouter {
    state: HistoryState;
    initializeAndSubscribeOnChange: (config: SubscribeChangeConfig) => VoidFunction;
    subscribeOnListenHistory: (callback: (update: RouterUpdate, prevLocation?: RouterLocation | null) => void) => VoidFunction;
    navigate: (hash: string, state?: Record<string, unknown>) => void;
    replaceState : (config?: {state?: Record<string, unknown>; hash?: string;}) => void;
    goBack: VoidFunction;
    goToPrev: VoidFunction;
    isExistPageByCurrentHash: (hash?: string) => boolean;
}

export interface RouterInfoArgs {
    state?: Record<string, unknown>; 
    hash?: string;
}
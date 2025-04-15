import type { 
    NavigationResult, 
    NavigationState, 
    NavigationHistoryEntry 
} from '#src/types';

// Utility functions
const generateRandomId = () => Math.random().toString(36).substring(2, 9);

export const getHash = (url: string): string => {
    const urlObject = new URL(url);

    return urlObject.hash.slice(1).replace('/', '') || '/';
};

export const createHash = (hash: string) => `/${hash}`;

export const createHistoryEntry = (
    url: string, 
    state?: NavigationState, 
    index: number = 0
): NavigationHistoryEntry => {
    const entry = {
        url,
        key         : generateRandomId(),
        id          : generateRandomId(),
        index,
        sameDocument: true,
        state,
        getState    : function<T extends NavigationState = NavigationState>(): T | undefined {        
            return this.state as T;
        },
        getHash: () => getHash(url),
    };
    
    // Bind the getState method to the entry object
    entry.getState = entry.getState.bind(entry);
    
    return entry;
};

export const createNavigationResult = (destination: NavigationHistoryEntry): NavigationResult => {
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
};
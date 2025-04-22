import type { 
    NavigationResult, 
    NavigationState, 
    NavigationHistoryEntry, 
    QueryParams
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
    state: NavigationState = {}, 
    index: number = 0
): NavigationHistoryEntry => {
    return {
        url,
        key         : generateRandomId(),
        id          : generateRandomId(),
        index,
        sameDocument: true,
        state,
        hash        : getHash(url),
    };
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

export const isRouteMatch = (pattern: string, hash: string) => {
    // Handle null or undefined hash
    if(hash === null || hash === undefined) {
        return false;
    }

    // Split the pattern and URL into segments to ensure they have the same length
    const patternSegments = pattern.split('/');
    const hashSegments = hash.split('/');
    
    // If the segments don't match in length, return false
    if(patternSegments.length !== hashSegments.length) {
        return false;
    }
    
    // Replace route parameters with a regex pattern that matches any characters
    const patternRegex = pattern.replace(/:\w+/g, '([^/]+)');
  
    // Create a regular expression for matching the URL
    const regex = new RegExp(`^${patternRegex}$`);
    
    // Check if the hash matches the pattern
    return regex.test(hash);
};

export const getRouteMap = (routeNames: string[]) => {
    return routeNames.reduce((acc, name) => {
        acc[name] = name;
        return acc;
    }, {} as Record<string, string>);
};

export const getRouteItem = <T>(map: Record<string, T>, hash: string) => {
    let route: T | undefined;

    return Object.keys(map).reduce((acc, key) => {
        if(isRouteMatch(key, hash)) {
            acc = map[key];
        }
        return acc;
    }, route);
};

export const getParamsFromUrl = (pattern: string, hash: string): Record<string, string> => {
    const params: Record<string, string> = {};
    
    // Split the pattern and URL into segments
    const patternSegments = pattern.split('/');
    const urlSegments = hash.split('/');
    
    // If the segments don't match in length, return empty params
    if(patternSegments.length !== urlSegments.length) {
        return params;
    }
    
    // Iterate through the pattern segments
    for(let i = 0; i < patternSegments.length; i++) {
        const patternSegment = patternSegments[i];
        
        // Check if the segment is a parameter (starts with ':')
        if(patternSegment.startsWith(':')) {
            // Extract the parameter name (remove the ':')
            const paramName = patternSegment.substring(1);
            // Get the corresponding value from the URL
            const paramValue = urlSegments[i];
            // Remove query
            const normalizedValue = paramValue.split('?')[0];

            // Add to the params object
            params[paramName] = normalizedValue;
        }
    }
    
    return params;
};

export const parseQueryParams = <T extends QueryParams = QueryParams>(urlPart: string): T => {
    const queryString = urlPart.split('?')[1];

    if(!queryString) {
        return {} as T;
    }
  
    const params = queryString.split('&');
    const queryParams: { [key: string]: string } = {};
  
    params.forEach((param) => {
        const [key, value] = param.split('=');

        queryParams[key] = value ? decodeURIComponent(value) : '';
    });
  
    return queryParams as T;
};
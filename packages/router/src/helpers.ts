import type {
    NavigationHistoryEntry,
    NavigationState,
    QueryParams
} from './types';

// Utility functions
const generateRandomId = () => Math.random().toString(36).substring(2, 9);

const safeDecodeURIComponent = (value: string): string => {
    try {
        return decodeURIComponent(value);
    }
    catch{
        return value;
    }
};

const decodeQueryValue = (value: string): string => {
    return safeDecodeURIComponent(value.replaceAll('+', ' '));
};

export const getHash = (url: string): string => {
    let urlObject: URL;

    try {
        urlObject = new URL(url);
    }
    catch{
        try {
            urlObject = new URL(url, window.location.href);
        }
        catch{
            return '/';
        }
    }

    return urlObject.hash.replace(/^#\/?#?/, '') || '/';
};

export const createHash = (hash: string): string => {
    let normalized = hash.replace(/^#+/, '').replace(/^\/+/, '');

    while(normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }

    return `/${normalized}`;
};

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

/**
 * Strips the query string and the surrounding slashes from a route path, so
 * '/users/123?tab=info', 'users/123' and '/users/123/' all normalize to
 * 'users/123'. The hash the router produces never carries a leading slash
 * (see getHash), while patterns are commonly written with one, so both sides
 * must be normalized before they are compared or split into segments.
 */
const normalizeRoutePath = (routePath: string): string => {
    const withoutQuery = routePath.split('?', 1)[0];
    const trimmedStart = withoutQuery.startsWith('/') ? withoutQuery.slice(1) : withoutQuery;
    const normalized = trimmedStart.endsWith('/') ? trimmedStart.slice(0, -1) : trimmedStart;

    return normalized;
};

export const isRouteMatch = (pattern: string, hash: string | null | undefined) => {
    // Handle null or undefined hash
    if(hash === null || hash === undefined) {
        return false;
    }

    // Normalize both sides so the slash style of the pattern does not matter
    const normalizedPattern = normalizeRoutePath(pattern);
    const normilizedHash = normalizeRoutePath(hash);

    // Split the pattern and URL into segments to ensure they have the same length
    const patternSegments = normalizedPattern.split('/');
    const hashSegments = normilizedHash.split('/');

    // If the segments don't match in length, return false
    if(patternSegments.length !== hashSegments.length) {
        return false;
    }

    // Replace route parameters with a placeholder, escape regex special
    // characters in static segments, then restore the parameter matcher
    const patternRegex = normalizedPattern
        .replaceAll(/:\w+/g, '@@PARAM@@')
        .replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
        .replaceAll('@@PARAM@@', '([^/]+)');

    // Create a regular expression for matching the URL
    const regex = new RegExp(`^${patternRegex}$`);

    // Check if the hash matches the pattern
    return regex.test(normilizedHash);
};

export const getRouteMap = (routeNames: string[]) => {
    const routeMap: Record<string, string> = {};

    for(const name of routeNames) {
        routeMap[name] = name;
    }

    return routeMap;
};

export const getRouteItem = <T>(map: Record<string, T>, hash: string) => {
    for(const [key, value] of Object.entries(map)) {
        if(isRouteMatch(key, hash)) {
            return value;
        }
    }
};

export const getUrlFromPattern = (
    pattern: string,
    params?: Record<string, string | number>
): string => {
    if(!params) {
        return pattern;
    }

    // Replace :paramName segments with values, keeping the placeholder
    // untouched when a value for the parameter is missing
    return pattern.replaceAll(/:(\w+)/g, (match, name: string) => {
        return String(params[name] ?? match);
    });
};

export const getParamsFromUrl = (pattern: string, hash: string): Record<string, string> => {
    const params: Record<string, string> = {};

    // Normalize both sides exactly like isRouteMatch does, otherwise a
    // mismatching segment count silently drops every param. A query string
    // containing a slash ('?redirect=/home') must not add extra segments.
    const patternSegments = normalizeRoutePath(pattern).split('/');
    const urlSegments = normalizeRoutePath(hash).split('/');

    // If the segments don't match in length, return empty params
    if(patternSegments.length !== urlSegments.length) {
        return params;
    }

    // Iterate through the pattern segments
    for(const [i, patternSegment] of patternSegments.entries()) {
        // Check if the segment is a parameter (starts with ':')
        if(!patternSegment.startsWith(':')) {
            continue;
        }

        // Extract the parameter name (remove the ':')
        const paramName = patternSegment.substring(1);
        // Get the corresponding value from the URL
        const paramValue = urlSegments[i];

        // Add to the params object
        params[paramName] = safeDecodeURIComponent(paramValue);
    }

    return params;
};

export const parseQueryParams = <T extends QueryParams = QueryParams>(urlPart: string): T => {
    const separatorIndex = urlPart.indexOf('?');

    if(separatorIndex === -1) {
        return {} as T;
    }

    const queryString = urlPart.slice(separatorIndex + 1);
    const params = queryString.split('&');
    const queryParams: { [key: string]: string; } = {};

    for(const param of params) {
        const separatorIndex = param.indexOf('=');
        const hasSeparator = separatorIndex !== -1;
        const key = decodeQueryValue(hasSeparator ? param.slice(0, separatorIndex) : param);
        const value = hasSeparator ? decodeQueryValue(param.slice(separatorIndex + 1)) : '';

        queryParams[key] = value;
    }

    return queryParams as T;
};

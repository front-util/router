import { encodeQueryParams } from '@front-utils/utils';

import { QuerySet, RouterHistory, RouterLocation } from "./types";

export const URL_DELIMETER = '#/#'; 

export const createHash = (hash: string, queryState?: Record<string, unknown>) => {
    const query = queryState ? `?${encodeQueryParams(queryState)}`: '';

    return `${URL_DELIMETER}${hash}${query}`;
};

export const getClearedHistoryFullHash = (hash = '') => {
    return hash.replace('#', '');
};

export const getClearedHistoryHash = (hash = '') => {
    return getClearedHistoryFullHash(hash).split('?')[0];
};

export const getQueryFromUrl = (url = '') => {
    return url.split('?')[1];
};

export const getHashFromUrl = (url = '') => {
    return url.split(URL_DELIMETER)[1];
};

export const getQueryFromHash = (hash = '') => {
    const stringQuery = getQueryFromUrl(hash);

    if(!stringQuery?.length) {
        return null;
    }
    const queryParams = stringQuery.split('&');

    return queryParams.reduce((acc, query) => {
        const [key, value] = query.split('=');

        acc[key] = value;

        return acc;
    }, {} as QuerySet);
};

export const modifyLocation = (location: RouterLocation) => {
    return {
        ...location,
        hash : getClearedHistoryHash(location.hash),
        query: getQueryFromHash(location.hash),
    };
};

export const checkIsHistoryInstance = (history?: RouterHistory) => {
    if(!history) {
        return false;
    }
    return typeof history.push === 'function' && 
        typeof history.back === 'function' &&
        typeof history.replace === 'function' &&
        typeof history.listen === 'function';
};

export const createLocationFromNavEntry = (entry?: NavigationHistoryEntry | NavigationDestination | null) => {
    const currentEntry = entry ?? window.navigation.currentEntry;

    return {
        pathname: currentEntry?.url ?? '',
        search  : getQueryFromUrl(currentEntry?.url),
        hash    : getHashFromUrl(currentEntry?.url),
        state   : currentEntry?.getState(),
        key     : currentEntry?.key ?? '',
    };
};
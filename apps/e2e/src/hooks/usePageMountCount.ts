import { useEffect, useState } from 'react';

const pageMountCounts: Record<string, number> = {};

/**
 * Tracks how many times a host page component was actually mounted.
 * Used by e2e tests to prove react-router does not force-remount the
 * mini-app pages during hash-only navigation.
 */
export const usePageMountCount = (pageName: string): number => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        pageMountCounts[pageName] = (pageMountCounts[pageName] ?? 0) + 1;
        setCount(pageMountCounts[pageName]);
    }, [pageName]);

    return count;
};

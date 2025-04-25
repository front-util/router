import React, { memo, useEffect, useState } from 'react';
import { useSignals } from '@preact/signals-react/runtime';

import { ClientRouterProps } from '../types';
import { getRouteItem } from '../helpers';

/**
 * ClientRouter component for React applications
 * Renders components based on the current hash route
 */
export const ClientRouter = memo<ClientRouterProps>(({ 
    className,
    router, 
    routes, 
    homeUrl,
    notFoundComponent: NotFound, 
}) => {
    useSignals();
    const [hash, setHash] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Subscribe to route changes
        const unsubscribe = router.create({
            config: {
                homeUrl,
                routeNames: Object.keys(routes),
            },
            onChange: (entry) => {
                setHash(entry.hash);
            },
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
            router.destroy();
        };
    }, [NotFound, homeUrl, router, routes]);
    const Component = (hash ? getRouteItem(routes, hash) : null) ?? NotFound;

    return (
        <div 
            className={className}
            key={hash}
        >
            <Component {...router.currentEntry.value.getParams()} />
        </div>
    );
});
import React, { memo, useEffect } from 'react';
import { useSignals } from '@preact/signals-react/runtime';
import { useSignal, useComputed } from '@preact/signals-react';

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
    const hashSignal = useSignal<string | undefined>(undefined);

    const componentSignal = useComputed(() => {
        if(typeof hashSignal.value === 'undefined') {
            return null;
        }
        
        return getRouteItem(routes, hashSignal.value) ?? NotFound;
    });
    const Component = componentSignal.value;

    useEffect(() => {
        // Subscribe to route changes
        const unsubscribe = router.create({
            config: {
                homeUrl,
                routeNames: Object.keys(routes),
            },
            onChange: (entry) => {
                hashSignal.value = entry.hash;
            },
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
            router.destroy();
        };
    }, [hashSignal, homeUrl, router, routes]);

    useEffect(() => {
        const controller = new AbortController();

        window.addEventListener('popstate', (evt) => {
            evt.stopPropagation();
        }, {
            signal: controller.signal,
        });

        return () => {
            controller.abort();
        };
    }, []);

    return (
        <div 
            className={className}
            key={hashSignal.value}
        >
            {!!Component && <Component {...router.currentEntry.value.getParams()} />}
        </div>
    );
});
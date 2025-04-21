import React, { useEffect, useState } from 'react';
import { useSignals } from '@preact/signals-react/runtime';

import { ClientRouterProps, RouteComponent } from '#src/types';

/**
 * ClientRouter component for React applications
 * Renders components based on the current hash route
 */
export const ClientRouter: React.FC<ClientRouterProps> = ({ 
    className,
    router, 
    routes, 
    homeUrl,
    notFoundComponent: NotFound, 
}) => {
    useSignals();
    const [Component, setComponent] = useState<RouteComponent | null>(null);

    useEffect(() => {
        // Subscribe to route changes
        const unsubscribe = router.create({
            config: {
                homeUrl,
                routeNames: [...routes.keys()],
            },
            onChange: (entry, _, navigationStatus) => {
                const CurrentComponent = routes.get(entry.hash);

                if(navigationStatus === 'notfound' || !CurrentComponent) {
                    setComponent(NotFound);
                    return;
                }
                setComponent(CurrentComponent);
            },
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
            router.destroy();
        };
    }, [NotFound, homeUrl, router, routes]);

    if(!Component) {
        return null;
    }

    return (
        <div className={className}>
            <Component {...router.currentEntry.value.getParams()} />
        </div>
    );
};
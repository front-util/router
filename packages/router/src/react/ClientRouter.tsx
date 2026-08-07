import { useSignal } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import React, { memo, useEffect, useRef } from 'react';

import { getRouteItem } from '../helpers';
import { ClientRouterProps } from '../types';

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

    // Resolve the component during render so a changed route group
    // (e.g. auth toggling) re-selects the route even when the hash itself
    // did not change. hashSignal is read reactively through useSignals.
    const Component = hashSignal.value === undefined
        ? null
        : getRouteItem(routes, hashSignal.value) ?? NotFound;

    // Track the last applied config and active subscription so the router is
    // only re-created when the route group actually changes, not on every
    // render with an inline routes object
    const configRef = useRef<{ homeUrl: string; routeNames: string[]; } | null>(null);
    const unsubscribeRef = useRef<VoidFunction | null>(null);

    useEffect(() => {
        const nextConfig = {
            homeUrl,
            routeNames: Object.keys(routes),
        };
        const prevConfig = configRef.current;

        if(prevConfig && JSON.stringify(prevConfig) === JSON.stringify(nextConfig)) {
            return;
        }
        configRef.current = nextConfig;

        if(unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        unsubscribeRef.current = router.create({
            config  : nextConfig,
            onChange: (entry) => {
                hashSignal.value = entry.hash;
            },
        });
    }, [hashSignal, homeUrl, router, routes]);

    useEffect(() => {
        return () => {
            if(unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            router.destroy();
        };
    }, [router]);

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
        <div className={className}>
            {!!Component && <Component {...router.currentEntry.value.getParams()} />}
        </div>
    );
});

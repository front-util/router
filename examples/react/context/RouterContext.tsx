import React, { createContext, useContext } from 'react';
import { HashRouter } from '../../../src/types';
import { hashRouter } from '../../../src/core/hashRouter';

// Create router context
const RouterContext = createContext<HashRouter>(hashRouter);

// Router provider component
export const RouterProvider: React.FC<{children: React.ReactNode}> = ({ children, }) => {
    return (
        <RouterContext.Provider value={hashRouter}>
            {children}
        </RouterContext.Provider>
    );
};

// Custom hook for router access
export function useRouter() {
    return useContext(RouterContext);
}
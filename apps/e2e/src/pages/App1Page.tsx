import { MiniApp1 } from '@front-utils/e2e-mini-app-1';
import React from 'react';

import { DebugPanel } from '../components/DebugPanel';
import { usePageMountCount } from '../hooks/usePageMountCount';

type App1PageProps = {
    isAuthorized: boolean;
};

export const App1Page: React.FC<App1PageProps> = ({ isAuthorized, }) => {
    const mountCount = usePageMountCount('app1');

    return (
        <div className="host-page" data-testid="page-app1">
            <div className="page-meta">
                <span>page mount count: </span>
                <strong data-testid="app1-mount-count">{mountCount}</strong>
            </div>
            <MiniApp1 isAuthorized={isAuthorized} />
            <DebugPanel />
        </div>
    );
};

export default App1Page;

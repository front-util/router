import { MiniApp2 } from '@front-utils/e2e-mini-app-2';
import React from 'react';

import { DebugPanel } from '../components/DebugPanel';
import { usePageMountCount } from '../hooks/usePageMountCount';

type App2PageProps = {
    isAuthorized: boolean;
};

export const App2Page: React.FC<App2PageProps> = ({ isAuthorized, }) => {
    const mountCount = usePageMountCount('app2');

    return (
        <div className="host-page" data-testid="page-app2">
            <div className="page-meta">
                <span>page mount count: </span>
                <strong data-testid="app2-mount-count">{mountCount}</strong>
            </div>
            <MiniApp2 isAuthorized={isAuthorized} />
            <DebugPanel />
        </div>
    );
};

export default App2Page;

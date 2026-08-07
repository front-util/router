import { MiniApp1 } from '@front-utils/e2e-mini-app-1';
import { MiniApp2 } from '@front-utils/e2e-mini-app-2';
import React, { useState } from 'react';

import { DebugPanel } from '../components/DebugPanel';

type DualPageProps = {
    isAuthorized: boolean;
};

/**
 * Mounts both mini apps at the same time on the shared hashRouter
 * singleton — reproduces the concurrent multi-instance scenario.
 */
export const DualPage: React.FC<DualPageProps> = ({ isAuthorized, }) => {
    const [showMiniApp2, setShowMiniApp2] = useState(true);

    return (
        <div className="host-page" data-testid="page-dual">
            <button data-testid="toggle-mini-app-2" onClick={() => setShowMiniApp2((value) => !value)}>
                {showMiniApp2 ? 'Unmount Mini App 2' : 'Mount Mini App 2'}
            </button>
            <div className="dual-layout">
                <MiniApp1 isAuthorized={isAuthorized} />
                {showMiniApp2 && <MiniApp2 isAuthorized={isAuthorized} />}
            </div>
            <DebugPanel />
        </div>
    );
};

export default DualPage;

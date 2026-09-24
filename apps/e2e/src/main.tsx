import { hashRouter } from '@front-utils/router';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import './app.css';

declare global {
    interface Window {
        __bootCount            : number;
        __router               : typeof hashRouter;
        __routerSubscribeCalls?: RouterSubscribeCall[];
    }
}

type RouterSubscribeCall = {
    navigationStatus: string;
    entryHash       : string;
    getHash         : string;
    hasPage         : boolean;
    canGoBack       : boolean;
};

// Incremented on every full page load — lets e2e tests verify that in-app
// navigation never triggers a reload
window.__bootCount = (window.__bootCount ?? 0) + 1;
window.__router = hashRouter;

// Module-scope subscription, before React mounts and before any
// create()/ClientRouter runs — mirrors the consumer pattern that surfaced the
// premature 'notfound' on first launch. Every navigationStatus (including
// intermediate transitions) is recorded alongside router API reads so tests
// can assert that consumers may call API methods during any transition,
// starting with the very first one.
window.__routerSubscribeCalls = [];

hashRouter.subscribe((entry, _prev, navigationStatus) => {
    window.__routerSubscribeCalls?.push({
        navigationStatus,
        entryHash: entry.hash,
        getHash  : hashRouter.getHash(),
        hasPage  : hashRouter.hasPage(entry.hash),
        canGoBack: hashRouter.canGoBack.value,
    });
});

const container = document.getElementById('root');

if(container) {
    const root = createRoot(container);

    root.render(
        <BrowserRouter future={{
            v7_startTransition  : true,
            v7_relativeSplatPath: true,
        }}
        >
            <App />
        </BrowserRouter>
    );
}

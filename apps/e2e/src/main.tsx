import { hashRouter } from '@front-utils/router';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import './app.css';

declare global {
    interface Window {
        __bootCount: number;
        __router   : typeof hashRouter;
    }
}

// Incremented on every full page load — lets e2e tests verify that in-app
// navigation never triggers a reload
window.__bootCount = (window.__bootCount ?? 0) + 1;
window.__router = hashRouter;

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

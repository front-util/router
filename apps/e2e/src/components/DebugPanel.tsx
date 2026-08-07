import { hashRouter } from '@front-utils/router';
import { useSignals } from '@preact/signals-react/runtime';
import React, { useEffect, useState } from 'react';

/**
 * Live view of the shared hashRouter state. Lets e2e tests assert
 * hash / params / query / state / canGoBack / canGoForward / entries.
 */
export const DebugPanel: React.FC = () => {
    useSignals();

    const [navEvents, setNavEvents] = useState(0);

    useEffect(() => hashRouter.subscribe(() => {
        setNavEvents((count) => count + 1);
    }), []);

    const entry = hashRouter.currentEntry.value;

    return (
        <section className="debug-panel" data-testid="debug-panel">
            <h4>Router state</h4>
            <div data-testid="debug-hash">{entry.hash}</div>
            <div data-testid="debug-params">{JSON.stringify(entry.getParams())}</div>
            <div data-testid="debug-query">{JSON.stringify(entry.getQuery())}</div>
            <div data-testid="debug-state">{JSON.stringify(entry.state)}</div>
            <div data-testid="debug-can-go-back">{String(hashRouter.canGoBack.value)}</div>
            <div data-testid="debug-can-go-forward">{String(hashRouter.canGoForward.value)}</div>
            <div data-testid="debug-entries-count">{hashRouter.entries.value.length}</div>
            <div data-testid="debug-prev-hash">{hashRouter.prevEntry.value?.hash ?? 'null'}</div>
            <div data-testid="debug-nav-events">{navEvents}</div>
            <div data-testid="debug-url">{window.location.href}</div>
        </section>
    );
};

export default DebugPanel;

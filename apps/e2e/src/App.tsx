import React, { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';

import { App1Page } from './pages/App1Page';
import { App2Page } from './pages/App2Page';
import { DualPage } from './pages/DualPage';
import { HomePage } from './pages/HomePage';
import { NotFoundHostPage } from './pages/NotFoundHostPage';

/**
 * Multi-page host built on react-router v6. Pages /app1 and /app2 embed the
 * hash-router mini apps; /dual mounts both of them at once on the shared
 * hashRouter singleton.
 */
export const App: React.FC = () => {
    const [isAuthorized, setIsAuthorized] = useState(false);

    return (
        <div className="host-app" data-testid="host-app">
            <header className="host-header">
                <nav className="host-nav">
                    <Link to="/" data-testid="link-home">Home</Link>
                    <Link to="/app1" data-testid="link-app1">App 1</Link>
                    <Link to="/app2" data-testid="link-app2">App 2</Link>
                    <Link to="/dual" data-testid="link-dual">Dual</Link>
                </nav>
                <button
                    className="auth-toggle"
                    data-testid="toggle-auth"
                    onClick={() => setIsAuthorized((value) => !value)}
                >
                    {isAuthorized ? 'Deauthorize' : 'Authorize'}
                </button>
                <span className="auth-status" data-testid="auth-status">
                    {isAuthorized ? 'authorized' : 'guest'}
                </span>
                <span className="boot-count" data-testid="boot-count">
                    boot: {window.__bootCount}
                </span>
            </header>

            <main className="host-content">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/app1" element={<App1Page isAuthorized={isAuthorized} />} />
                    <Route path="/app2" element={<App2Page isAuthorized={isAuthorized} />} />
                    <Route path="/dual" element={<DualPage isAuthorized={isAuthorized} />} />
                    <Route path="*" element={<NotFoundHostPage />} />
                </Routes>
            </main>
        </div>
    );
};

export default App;

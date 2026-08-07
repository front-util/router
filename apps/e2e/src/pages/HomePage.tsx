import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => (
    <div className="host-page" data-testid="page-home">
        <h2>Host Home</h2>
        <p>Choose a mini app to embed the hash router.</p>
        <nav className="home-links">
            <Link to="/app1" data-testid="home-link-app1">Open Mini App 1</Link>
            <Link to="/app2" data-testid="home-link-app2">Open Mini App 2</Link>
            <Link to="/dual" data-testid="home-link-dual">Open Dual View</Link>
        </nav>
    </div>
);

export default HomePage;

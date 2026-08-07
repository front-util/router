import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundHostPage: React.FC = () => (
    <div className="host-page" data-testid="page-host-not-found">
        <h2>Host: 404</h2>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" data-testid="host-not-found-home-link">Back home</Link>
    </div>
);

export default NotFoundHostPage;

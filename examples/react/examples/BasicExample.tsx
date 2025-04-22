/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ClientRouter } from '../../../src/react/ClientRouter';
import { hashRouter } from '../../../src/core/hashRouter';
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import UserProfilePage from '../pages/UserProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import Navigation from '../components/Navigation';

// Create a map of routes to components
const routes = new Map<string, React.FC<any>>([
    ['home', HomePage],
    ['about', AboutPage],
    ['users/:userId', UserProfilePage]
]);
  
/**
 * Basic ClientRouter example
 * Shows a simple implementation of ClientRouter with basic navigation
 */
const BasicExample: React.FC = () => {
    return (
        <div className="app-container">
            <h2>Basic ClientRouter Example</h2>
            <Navigation />
      
            <main className="content-area">
                <ClientRouter
                    router={hashRouter}
                    routes={routes}
                    homeUrl="home"
                    notFoundComponent={NotFoundPage}
                    className="router-content"
                />
            </main>
        </div>
    );
};

export default BasicExample;
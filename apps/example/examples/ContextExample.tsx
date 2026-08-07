import { ClientRouter } from '@front-utils/router';
import React from 'react';

import ContextNavigation from '../components/ContextNavigation';
import { RouterProvider, useRouter } from '../context/RouterContext';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import SettingsPage from '../pages/SettingsPage';
import UserProfilePage from '../pages/UserProfilePage';

// Dashboard component for this example
const DashboardPage: React.FC = () => (
    <div className="page dashboard-page">
        <h1>Dashboard</h1>
        <p>Your application dashboard</p>
    </div>
);

const routes = {
    'home'           : HomePage,
    'dashboard'      : DashboardPage,
    'profile/:userId': UserProfilePage,
    'settings'       : SettingsPage,
};

// Main application component using context
const MainApp: React.FC = () => {
    const router = useRouter();

    return (
        <div className="app-container">
            <ContextNavigation />
            <main className="content-area">
                <ClientRouter
                    router={router}
                    routes={routes}
                    homeUrl="home"
                    notFoundComponent={NotFoundPage}
                    className="router-content"
                />
            </main>
        </div>
    );
};

/**
 * Context-based ClientRouter example
 * Demonstrates using React Context for better router organization
 */
const ContextExample: React.FC = () => {
    return (
        <div className="context-example">
            <h2>Context-based Router Example</h2>
            <RouterProvider>
                <MainApp />
            </RouterProvider>
        </div>
    );
};

export default ContextExample;

import { ClientRouter, hashRouter  } from '@front-utils/router';
import React from 'react';

import Navigation from '../components/Navigation';
import AboutPage from '../pages/AboutPage';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import ProductPage from '../pages/ProductPage';
import SettingsPage from '../pages/SettingsPage';
import UserProfilePage from '../pages/UserProfilePage';

const routes = {
    'home'                           : HomePage,
    'about'                          : AboutPage,
    'settings'                       : SettingsPage,
    'users/:userId'                  : UserProfilePage,
    'products/electronics/:productId': ProductPage,
};

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

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { ClientRouter } from '../../../src/react/ClientRouter';
import { hashRouter } from '../../../src/core/hashRouter';
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';
import UserProfilePage from '../pages/UserProfilePage';
import ProductPage from '../pages/ProductPage';
import NotFoundPage from '../pages/NotFoundPage';

// Create a map of routes to components with typed parameters
const routes = {
    'home': HomePage,
    'about': AboutPage,
    'users/:userId': UserProfilePage,
    'products/:categoryId/:productId': ProductPage
}
  
/**
 * Advanced ClientRouter example
 * Shows usage with TypeScript, route parameters and query parameters
 */
const AdvancedExample: React.FC = () => {
    const [currentParams, setCurrentParams] = useState<any>({});
    const [currentQuery, setCurrentQuery] = useState<any>({});
  
    useEffect(() => {
    // Example of subscribing to location changes to access parameters
        return hashRouter.subscribe(() => {
            setCurrentParams(hashRouter.currentEntry.value.getParams());
            setCurrentQuery(hashRouter.currentEntry.value.getQuery());
        });
    }, []);
  
    return (
        <div className="app-container">
            <h2>Advanced ClientRouter Example</h2>
      
            <nav className="main-navigation">
                <button onClick={() => hashRouter.navigate('home')}>Home</button>
                <button onClick={() => hashRouter.navigate('about')}>About</button>
                <button onClick={() => hashRouter.navigate('users/123?tab=settings')}>
                    User 123
                </button>
                <button onClick={() => 
                    hashRouter.navigate('products/electronics/laptop?color=silver')
                }>
                    Silver Laptop
                </button>
                {hashRouter.canGoBack.value && (
                    <button onClick={() => hashRouter.goBack()}>
                        Back
                    </button>
                )}
            </nav>
      
            <div className="debug-panel">
                <h3>Current Route Information</h3>
                <p>Hash: {hashRouter.getHash()}</p>
                <p>Parameters: {JSON.stringify(currentParams)}</p>
                <p>Query: {JSON.stringify(currentQuery)}</p>
            </div>
      
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

export default AdvancedExample;
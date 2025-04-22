import React from 'react';
import { hashRouter } from '../../../src/core/hashRouter';

const Navigation: React.FC = () => {
    return (
        <nav className="main-navigation">
            <button onClick={() => hashRouter.navigate('home')}>Home</button>
            <button onClick={() => hashRouter.navigate('about')}>About</button>
            <button onClick={() => hashRouter.navigate('users/123?tab=settings')}>
                User Profile
            </button>
            <button onClick={() => 
                hashRouter.navigate('products/electronics/laptop?color=silver')
            }>
                Product Page
            </button>
            <button onClick={() => hashRouter.navigate('settings')}>
                Settings
            </button>
            {hashRouter.canGoBack.value && (
                <button onClick={() => hashRouter.goBack()}>
                    Back
                </button>
            )}
        </nav>
    );
};

export default Navigation;
import React from 'react';
import { useRouter } from '../context/RouterContext';

const ContextNavigation: React.FC = () => {
    const router = useRouter();
  
    return (
        <nav className="main-navigation">
            <button onClick={() => router.navigate('home')}>Home</button>
            <button onClick={() => router.navigate('dashboard')}>Dashboard</button>
            <button onClick={() => router.navigate('profile/123')}>Profile</button>
            <button onClick={() => router.navigate('settings')}>Settings</button>
            {router.canGoBack.value && (
                <button onClick={() => router.goBack()}>Back</button>
            )}
        </nav>
    );
};

export default ContextNavigation;
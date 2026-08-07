import { ClientRouter, hashRouter } from '@front-utils/router';
import React from 'react';

export type MiniApp1Props = {
    isAuthorized: boolean;
};

type UserProfileProps = {
    userId?: string;
};

const AuthorizedDashboard = () => (
    <div className="mini-app-page" data-testid="mini-app-1-route" data-route="dashboard">
        <h2>Dashboard</h2>
    </div>
);

const Settings = () => (
    <div className="mini-app-page" data-testid="mini-app-1-route" data-route="settings">
        <h2>Settings</h2>
    </div>
);

const UserProfile = ({ userId, }: UserProfileProps) => {
    const tab = hashRouter.currentEntry.value.getQuery()['tab'] ?? 'profile';

    return (
        <div className="mini-app-page" data-testid="mini-app-1-route" data-route="users">
            <h2>User: {userId}</h2>
            <p data-testid="mini-app-1-tab">Tab: {tab}</p>
        </div>
    );
};

const Login = () => (
    <div className="mini-app-page" data-testid="mini-app-1-route" data-route="login">
        <h2>Login</h2>
    </div>
);

const About = () => (
    <div className="mini-app-page" data-testid="mini-app-1-route" data-route="about">
        <h2>About Mini App 1</h2>
    </div>
);

const NotFound = () => (
    <div className="mini-app-page" data-testid="mini-app-1-route" data-route="not-found">
        <h2>Mini App 1: 404</h2>
    </div>
);

const authorizedRoutes = {
    'dashboard'    : AuthorizedDashboard,
    'settings'     : Settings,
    'users/:userId': UserProfile,
};

const unauthorizedRoutes = {
    login: Login,
    about: About,
};

/**
 * Mini application #1 embedded into the host page /app1.
 * The route group and the start hash depend on the auth condition.
 */
export const MiniApp1 = ({ isAuthorized, }: MiniApp1Props) => {
    const routes = isAuthorized ? authorizedRoutes : unauthorizedRoutes;
    const homeUrl = isAuthorized ? 'dashboard' : 'login';

    return (
        <div className="mini-app" data-testid="mini-app-1">
            <h3>Mini App 1 ({isAuthorized ? 'authorized' : 'guest'})</h3>
            <nav className="mini-app-nav" data-testid="mini-app-1-nav">
                <button data-testid="mini-app-1-nav-dashboard" onClick={() => hashRouter.navigate('dashboard')}>Dashboard</button>
                <button data-testid="mini-app-1-nav-settings" onClick={() => hashRouter.navigate('settings')}>Settings</button>
                <button data-testid="mini-app-1-nav-user" onClick={() => hashRouter.navigate('users/42?tab=prefs')}>User 42</button>
                <button data-testid="mini-app-1-nav-login" onClick={() => hashRouter.navigate('login')}>Login</button>
                <button data-testid="mini-app-1-nav-about" onClick={() => hashRouter.navigate('about')}>About</button>
                <button data-testid="mini-app-1-nav-back" onClick={() => hashRouter.goBack()}>Back</button>
                <button data-testid="mini-app-1-nav-prev" onClick={() => hashRouter.goToPrev()}>Prev</button>
            </nav>
            <main className="mini-app-content">
                <ClientRouter
                    router={hashRouter}
                    routes={routes}
                    homeUrl={homeUrl}
                    notFoundComponent={NotFound}
                />
            </main>
        </div>
    );
};

export default MiniApp1;

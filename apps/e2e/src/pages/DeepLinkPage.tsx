import { ClientRouter, hashRouter } from '@front-utils/router';
import React from 'react';

import { DebugPanel } from '../components/DebugPanel';

type ProfileProps = {
    id?: string;
};

const Home = () => (
    <div className="deep-link-page" data-testid="deep-link-route" data-route="home">
        <h2>Deep Link Home</h2>
    </div>
);

const Profile = ({ id, }: ProfileProps) => {
    const tab = hashRouter.currentEntry.value.getQuery()['tab'] ?? 'profile';

    return (
        <div className="deep-link-page" data-testid="deep-link-route" data-route="profile">
            <h2>Profile: {id}</h2>
            <p data-testid="deep-link-tab">Tab: {tab}</p>
        </div>
    );
};

// The pattern is registered with a leading slash on purpose: the hash the
// router produces never has one, so this route locks in that both spellings
// resolve the same pattern and params.
const routes = {
    'home'            : Home,
    'profile/:id'     : Profile,
    '/orders/:orderId': Profile,
};

const NotFound = () => (
    <div className="deep-link-page" data-testid="deep-link-route" data-route="not-found">
        <h2>Deep Link: 404</h2>
    </div>
);

/**
 * Host page with a constant route group. Unlike /app1 and /app2 there is no
 * auth toggle, so a full reload keeps the same routes mounted and a deep link
 * is not redirected to a guest home on the next boot.
 */
export const DeepLinkPage: React.FC = () => (
    <div className="host-page" data-testid="page-deep-link">
        <nav data-testid="deep-link-nav">
            <button data-testid="deep-link-nav-home" onClick={() => hashRouter.navigate('home')}>Home</button>
            <button
                data-testid="deep-link-nav-profile"
                onClick={() => hashRouter.navigate('profile/1001?tab=info')}
            >
                Profile 1001
            </button>
            <button data-testid="deep-link-nav-orders" onClick={() => hashRouter.navigate('orders/77')}>Order 77</button>
        </nav>
        <ClientRouter
            router={hashRouter}
            routes={routes}
            homeUrl="home"
            notFoundComponent={NotFound}
        />
        <DebugPanel />
    </div>
);

export default DeepLinkPage;

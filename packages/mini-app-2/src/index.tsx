import { ClientRouter, hashRouter } from '@front-utils/router';
import React from 'react';

export type MiniApp2Props = {
    isAuthorized: boolean;
};

type ProductProps = {
    productId?: string;
};

const Overview = () => (
    <div className="mini-app-page" data-testid="mini-app-2-route" data-route="overview">
        <h2>Overview</h2>
    </div>
);

const Product = ({ productId, }: ProductProps) => {
    const color = hashRouter.currentEntry.value.getQuery()['color'];

    return (
        <div className="mini-app-page" data-testid="mini-app-2-route" data-route="products">
            <h2>Product: {productId}</h2>
            {color && <p data-testid="mini-app-2-color">Color: {color}</p>}
        </div>
    );
};

const Signup = () => (
    <div className="mini-app-page" data-testid="mini-app-2-route" data-route="signup">
        <h2>Signup</h2>
    </div>
);

const Landing = () => (
    <div className="mini-app-page" data-testid="mini-app-2-route" data-route="landing">
        <h2>Landing</h2>
    </div>
);

const NotFound = () => (
    <div className="mini-app-page" data-testid="mini-app-2-route" data-route="not-found">
        <h2>Mini App 2: 404</h2>
    </div>
);

const authorizedRoutes = {
    'overview'           : Overview,
    'products/:productId': Product,
};

const unauthorizedRoutes = {
    signup : Signup,
    landing: Landing,
};

/**
 * Mini application #2 embedded into the host page /app2.
 * The route group and the start hash depend on the auth condition.
 */
export const MiniApp2 = ({ isAuthorized, }: MiniApp2Props) => {
    const routes = isAuthorized ? authorizedRoutes : unauthorizedRoutes;
    const homeUrl = isAuthorized ? 'overview' : 'signup';

    return (
        <div className="mini-app" data-testid="mini-app-2">
            <h3>Mini App 2 ({isAuthorized ? 'authorized' : 'guest'})</h3>
            <nav className="mini-app-nav" data-testid="mini-app-2-nav">
                <button data-testid="mini-app-2-nav-overview" onClick={() => hashRouter.navigate('overview')}>Overview</button>
                <button data-testid="mini-app-2-nav-product" onClick={() => hashRouter.navigate('products/7?color=silver')}>Product 7</button>
                <button data-testid="mini-app-2-nav-signup" onClick={() => hashRouter.navigate('signup')}>Signup</button>
                <button data-testid="mini-app-2-nav-landing" onClick={() => hashRouter.navigate('landing')}>Landing</button>
                <button data-testid="mini-app-2-nav-back" onClick={() => hashRouter.goBack()}>Back</button>
                <button data-testid="mini-app-2-nav-prev" onClick={() => hashRouter.goToPrev()}>Prev</button>
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

export default MiniApp2;


# Router Utility

A lightweight, flexible hash-based router implementation for modern web applications.

## Table of Contents

- [Router Utility](#router-utility)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Installation](#installation)
  - [Browser Compatibility](#browser-compatibility)
  - [API Documentation](#api-documentation)
    - [HashNavigation](#hashnavigation)
      - [Properties](#properties)
      - [Methods](#methods)
    - [HashRouter](#hashrouter)
      - [Properties](#properties-1)
      - [Methods](#methods-1)
    - [RouterHistoryEntry](#routerhistoryentry)
      - [Properties](#properties-2)
      - [Methods](#methods-2)
    - [ClientRouter](#clientrouter)
      - [Props](#props)
      - [Usage](#usage)
  - [Usage Examples](#usage-examples)
    - [Basic Setup](#basic-setup)
    - [Advanced Usage](#advanced-usage)
    - [Handling Route Changes](#handling-route-changes)
    - [Handling First Launch and Navigation Statuses](#handling-first-launch-and-navigation-statuses)
    - [State Management](#state-management)
    - [Route Parameters and Queries](#route-parameters-and-queries)
    - [TypeScript Usage](#typescript-usage)
    - [Integration with Frameworks](#integration-with-frameworks)
      - [React Integration](#react-integration)
      - [Signals in React](#signals-in-react)
      - [Using ClientRouter Component](#using-clientrouter-component)
      - [Vue Integration](#vue-integration)
  - [Contract Interfaces](#contract-interfaces)
    - [HashNavigation Interface](#hashnavigation-interface)
    - [HashRouter Interface](#hashrouter-interface)
    - [Router History Entry Interface](#router-history-entry-interface)
    - [Configuration Interfaces](#configuration-interfaces)
    - [Navigation History Interfaces](#navigation-history-interfaces)
  - [Contributing](#contributing)
  - [Troubleshooting](#troubleshooting)
  - [License](#license)

## Overview

This utility provides a hash-based navigation system that can be used to create single-page applications with client-side routing. It consists of two main components:

1. **HashNavigation** - A low-level API for managing browser history and hash-based navigation
2. **HashRouter** - A higher-level abstraction that provides an easy-to-use router interface
3. **ClientRouter** - A React component for declarative route rendering

## Installation

```bash
# Using npm
npm install @front-utils/router

# Using yarn
yarn add @front-utils/router
```

## Browser Compatibility

Router Utility is compatible with all modern browsers that support the History API:

- Chrome 49+
- Firefox 45+
- Safari 10+
- Edge 12+
- Opera 36+

For older browsers, consider using a polyfill for the History API.

## API Documentation

### HashNavigation

HashNavigation provides direct access to browser history and navigation functionality. It's designed as a lightweight wrapper around the browser's History API.

> It follows the entry model of the native Navigation API (`window.navigation`): `currentEntry`, `prevEntry`, `entries` and entry traversal. The promise-based parts of that API (commit lifecycle, `intercept()`, `scroll()`) are intentionally out of scope — this library runs on `window.history` + the hash for universal browser support.

#### Properties

- `currentEntry` - A read-only signal containing the current history entry
- `prevEntry` - A read-only signal containing the previous history entry
- `entries` - A read-only signal containing all history entries
- `canGoBack` - A read-only signal indicating if navigation backward is possible
- `canGoForward` - A read-only signal indicating if navigation forward is possible

#### Methods

- `navigate(hash, options)` - Navigate to a new hash, optionally with state
- `traverseTo(key, options)` - Navigate to a specific history entry by key
- `back()` - Navigate backward in history
- `goToPrev()` - Navigate to the previous history entry (uses `traverseTo`, falls back to `history.back()`)
- `forward()` - Navigate forward in history
- `updateCurrentEntry(options, hash)` - Update the state of the current entry, optionally updating the hash
- `updateCurrentEntryHash(hash, newState?: NavigationState | null | undefined)` - Update hash and state of the current entry
- `create()` - Initialize the navigation system
- `subscribe(callback)` - Subscribe to navigation changes with callback receiving current entry, previous entry, and hash
- `destroy()` - Clean up all listeners and resources

### HashRouter

HashRouter provides a higher-level API for common routing operations, with easier configuration and initialization.

#### Properties

- `_navigation` - Reference to the underlying HashNavigation instance
- `currentEntry` - A read-only signal containing the current router history entry with extended functionality
- `state` - A read-only signal providing access to the current navigation state
- `hash` - A read-only signal providing access to the current hash
- `entries` - A read-only signal containing all history entries (inherited from HashNavigation)
- `canGoBack` - A read-only signal indicating if navigation backward is possible (inherited from HashNavigation)
- `canGoForward` - A read-only signal indicating if navigation forward is possible (inherited from HashNavigation)

#### Methods

- `create(config)` - Initialize the router and subscribe to location changes
- `subscribe(callback)` - Subscribe to route changes; the callback receives the current entry, the previous entry, and the `navigationStatus` (`'success' | 'notfound' | 'notStarted'`)
- `navigate(hash, state)` - Navigate to a specific hash with optional state
- `navigateTo(pattern, params?, state?)` - Navigate to a route pattern, substituting params into the URL, e.g. `router.navigateTo('/user/:category/:id', { category: 5, id: 10 })` navigates to `/user/5/10`
- `replaceState(config)` - Replace the current state and/or hash
- `goBack()` - Navigate back in history
- `goToPrev()` - Navigate to the previous entry from the router model (`traverseTo`), falls back to `history.back()`
- `getHash()` - Get the current hash
- `getState()` - Get the current state
- `hasPage(hash?)` - Check if a page exists in configured routes
- `destroy()` - Clean up all listeners and resources
- `getConfig()` - Get the current router configuration

### RouterHistoryEntry

RouterHistoryEntry extends NavigationHistoryEntry with additional router-specific functionality.

#### Properties

- All properties from NavigationHistoryEntry (`url`, `key`, `id`, `index`, `sameDocument`, `state`, `hash`)
- `pattern` - The matched route pattern, if any

#### Methods

- `getParams<T>()` - Get URL parameters extracted from the route pattern
- `getQuery<T>()` - Get query parameters from the URL

### ClientRouter

ClientRouter is a React component that provides a declarative way to define and render routes in your React application. It automatically handles route changes, component rendering, and passing route parameters as props.

#### Props

- `router`: *(HashRouter)* - An instance of HashRouter to use for navigation
- `routes`: *(Record<string, React.ComponentType>)* - Route patterns mapped to React components. Leading slashes in patterns are optional (`'users/:userId'` and `'/users/:userId'` are equivalent)
- `homeUrl`: *(string)* - The default route to redirect to when no route matches
- `notFoundComponent`: *(React.ComponentType)* - Component to render when no route matches
- `className`: *(string, optional)* - CSS class to apply to the router container element

#### Usage

The ClientRouter simplifies route management in React applications by:

1. Automatically subscribing to route changes
2. Rendering the appropriate component for the current route
3. Passing route parameters as props to the rendered component
4. Handling "not found" routes with a custom component
5. Cleaning up subscriptions when unmounted

Internally it reads signals through `useSignals()` (`@preact/signals-react/runtime`) and a local `useSignal`, so it re-renders on every route change without any manual `setState` — see [Signals in React](#signals-in-react).

## Usage Examples

### Basic Setup

```typescript
import { hashRouter } from '@front-utils/router';

// Initialize the router with routes configuration.
// Call create() once on the app bootstrap: create()/destroy() are
// ref-counted, so nested or repeated create() without destroy() keeps one
// shared history model and listener.
const unsubscribe = hashRouter.create({
  onChange: (location) => {
    console.log('Route changed:', location.hash);
    // Update your UI based on the new location
  },
  config: {
    homeUrl: 'home',
    routeNames: ['home', 'about', 'contact', 'products']
  }
});

// Navigate to a different route
hashRouter.navigate('about');

// Clean up when the app is torn down (ClientRouter does it for you)
// unsubscribe();
```

### Advanced Usage

```typescript
import { hashRouter } from '@front-utils/router';

// Initialize with more complex state handling
hashRouter.create({
  onChange: (location) => {
    const hash = location.hash;
    const state = location.state;
    
    console.log('Current route:', hash);
    console.log('Route state:', state);
    
    // Update application state or UI based on the route
    renderPage(hash, state);
  },
  config: {
    homeUrl: 'dashboard',
    routeNames: ['dashboard', 'profile', 'settings', 'reports', 'logout']
  }
});

// Navigate with state
hashRouter.navigate('profile', { 
  userId: 123, 
  viewMode: 'edit' 
});

// Navigate to a parameterized route, substituting params into the URL
hashRouter.navigateTo('/user/:category/:id', { category: 5, id: 10 }); // -> #/user/5/10
hashRouter.navigateTo('/user/:id?tab=settings', { id: 7 }); // -> #/user/7?tab=settings

// Check if current route is valid
if (hashRouter.hasPage()) {
  console.log('Current route is valid');
} else {
  console.log('Invalid route, redirecting to home');
  hashRouter.navigate('dashboard');
}
```

### Handling Route Changes

```typescript
import { hashRouter } from '@front-utils/router';

// Create a route handler function
const handleRouteChange = (location) => {
  const hash = location.hash;
  const appContainer = document.getElementById('app');
  
  // Simple route-based content rendering (textContent — never build DOM
  // from untrusted strings via innerHTML)
  switch (hash) {
    case 'home':
      appContainer.textContent = 'Home Page';
      break;
    case 'about':
      appContainer.textContent = 'About Us';
      break;
    case 'contact':
      appContainer.textContent = 'Contact Us';
      break;
    default:
      appContainer.textContent = 'Page Not Found';
      break;
  }
};

// Initialize the router
hashRouter.create({
  onChange: handleRouteChange,
  config: {
    homeUrl: 'home',
    routeNames: ['home', 'about', 'contact']
  }
});

// Create navigation buttons
document.getElementById('home-btn').addEventListener('click', () => {
  hashRouter.navigate('home');
});

document.getElementById('about-btn').addEventListener('click', () => {
  hashRouter.navigate('about');
});

document.getElementById('contact-btn').addEventListener('click', () => {
  hashRouter.navigate('contact');
});

document.getElementById('back-btn').addEventListener('click', () => {
  hashRouter.goBack();
});
```

### Handling First Launch and Navigation Statuses

The callback passed to `subscribe()` and `create().onChange` receives a third argument — `navigationStatus`, describing the delivery for the current entry. Use it to avoid rendering a "not found" screen during the very first synchronous delivery, when the router config has not been applied yet:

```typescript
import { hashRouter } from '@front-utils/router';

// A module-scope subscription runs immediately during script evaluation. The
// first delivery reports navigationStatus === 'notStarted' because no
// create() has run yet — this must not be treated as a routing error.
hashRouter.subscribe((entry, prevEntry, navigationStatus) => {
  if(navigationStatus === 'notStarted') {
    console.log('Router is initializing — entry:', entry.hash, '| previous:', prevEntry?.hash);
    return; // the next delivery (after create()) carries an accurate status
  }

  if(navigationStatus === 'success') {
    console.log('Route found:', entry.hash);
    renderPage(entry);
    return;
  }

  // navigationStatus === 'notfound'
  console.log('No route matches:', entry.hash);
  renderNotFound();
});

// Applying the config re-emits an accurate status for the still-current entry,
// so the leading notStarted delivery is followed by success (valid deep link)
// or notfound (unknown route) without any navigation having happened.
hashRouter.create({
  onChange: () => {
    // Rendering is handled by the standalone subscribe() above
  },
  config: {
    homeUrl: 'home',
    routeNames: ['home', 'users/:id']
  }
});
```

### State Management

```typescript
import { hashRouter } from '@front-utils/router';

// Track a user's navigation through a product catalog
// Initialize with a product catalog setup
hashRouter.create({
  onChange: (location) => {
    const hash = location.hash;
    const state = location.state;
    
    if (hash === 'product') {
      const productId = state?.productId;
      if (productId) {
        // Fetch and display the product
        fetchProductDetails(productId).then(displayProduct);
      }
    }
  },
  config: {
    homeUrl: 'catalog',
    routeNames: ['catalog', 'product', 'cart', 'checkout']
  }
});

// Navigation to a specific product detail page
function viewProduct(productId) {
  hashRouter.navigate('product', { productId });
}

// Update state without changing the route
function updateProductOptions(options) {
  hashRouter.replaceState({ 
    state: { ...hashRouter.getState(), ...options } 
  });
}

// Example of accessing state from the current entry
function getCurrentProductId() {
  const state = hashRouter.getState();
  return state?.productId;
}
```

State and the page lifecycle:

- After a full page reload the entry state is **restored from the native `history.state`** — the router seeds and reconciles its model with it on boot (empty `{}` when nothing was stored). Navigations with state survive a reload:
  `hashRouter.navigate('product', { productId: 42 })` → F5 → `hashRouter.getState()` still returns `{ productId: 42 }`.
- Replacing the hash without an explicit new state (redirects, `updateCurrentEntryHash`) keeps the current state; passing an explicit `null` clears it.

### Route Parameters and Queries

```typescript
import { hashRouter } from '@front-utils/router';

// Setup routes with parameters
hashRouter.create({
  onChange: (location) => {
    // Get route parameters using the extended RouterHistoryEntry
    const params = hashRouter.currentEntry.value.getParams();
    const query = hashRouter.currentEntry.value.getQuery();
    
    console.log('Route params:', params);
    console.log('Query params:', query);
    
    // Example: Rendering different views based on params and query
    if (location.hash.includes('users')) {
      if (params.id) {
        renderUserDetails(params.id, query.tab || 'profile');
      } else {
        renderUsersList(query.page || '1', query.sort || 'name');
      }
    }
  },
  config: {
    homeUrl: 'home',
    // Define routes including parameter patterns
    routeNames: [
      'home', 
      'users', 
      'users/:id', 
      'products/:category/:id'
    ]
  }
});

// Navigate to parameterized routes
hashRouter.navigate('users/123?tab=settings');
hashRouter.navigate('products/electronics/laptop-15?color=silver&price=999');

// Helper functions to access params/query from the live current entry.
// Components reading these hooks must be subscribed to the signals:
// the Babel plugin @preact/signals-react/transform does it automatically,
// otherwise call useSignals() from @preact/signals-react/runtime —
// see “Signals in React” below.
function useRouteParams() {
  return hashRouter.currentEntry.value.getParams();
}

// Helper function to access query parameters
function useQueryParams() {
  return hashRouter.currentEntry.value.getQuery();
}
```

### TypeScript Usage

```typescript
import { hashRouter, NavigationHistoryEntry, InitializeRouterConfig, RouterHistoryEntry } from '@front-utils/router';

// Type-safe route configuration
interface AppRoutes {
  home: undefined;
  product: { id: string };
  checkout: { items: string[] };
}

// Define your routes
const routeConfig: InitializeRouterConfig = {
  homeUrl: 'home',
  routeNames: ['home', 'product', 'checkout']
};

// Type-safe route handler
function handleRouteChange(location: NavigationHistoryEntry): void {
  const hash = location.hash;
  
  // Access state in a type-safe way
  const state = hashRouter.getState();
  
  switch (hash) {
    case 'home':
      renderHomePage();
      break;
    case 'product':
      if (state && 'id' in state) {
        renderProductPage(state.id as string);
      }
      break;
    case 'checkout':
      if (state && 'items' in state) {
        renderCheckoutPage(state.items as string[]);
      }
      break;
  }
}

// Access route parameters with proper typing
function useTypedParams<T>() {
  return hashRouter.currentEntry.value.getParams<T>();
}

// Initialize with type-safe configuration
hashRouter.create({
  onChange: handleRouteChange,
  config: routeConfig
});

// Type-safe navigation with state
function navigateToProduct(productId: string): void {
  hashRouter.navigate('product', { id: productId });
}
```

### Integration with Frameworks

#### React Integration

The router state is exposed through Preact signals (`currentEntry`, `state`, `hash`, `entries`, `canGoBack`, `canGoForward`). In React this means:

- reading `someSignal.value` during render subscribes the component to that signal;
- when the underlying entry changes, subscribed components re-render automatically;
- **no `useState`/`useMemo` snapshots and no forced re-renders are needed** — snapshots from `getHash()`/`getState()` are stale the next moment the route changes.

```tsx
import { useSignalEffect } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import { hashRouter } from '@front-utils/router';

// Initialize once on the app bootstrap (module scope is fine for an SPA).
// create()/destroy() are ref-counted: nested/repeated create() without
// destroy() keeps one shared history model and one hashchange listener.
hashRouter.create({
  onChange: (entry, prevEntry, navigationStatus) => {
    // analytics, redirects, theme switching, etc.
  },
  config: {
    homeUrl: 'home',
    routeNames: ['home', 'users/:id', 'settings']
  }
});

// The component reads .value during render, so it subscribes to the
// signals it uses and re-renders when the route changes. useSignals()
// enables this subscription when the Babel plugin is not configured.
function App() {
  useSignals();

  const { hash } = hashRouter;
  const canGoBack = hashRouter.canGoBack.value;

  return (
    <div>
      <nav>
        <button onClick={() => hashRouter.navigate('home')}>Home</button>
        <button onClick={() => hashRouter.navigate('users/42')}>User 42</button>
        <button onClick={() => hashRouter.navigate('settings')}>Settings</button>
        {canGoBack && <button onClick={() => hashRouter.goBack()}>Back</button>}
      </nav>

      <main>
        {hash.value === 'home' && <HomePage />}
        {hash.value.startsWith('users/') && (
          <UserPage userId={hashRouter.currentEntry.value.getParams().id} />
        )}
        {hash.value === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

// Signal effects replace useEffect subscriptions for router side effects:
function DocumentTitle() {
  useSignalEffect(() => {
    // getHash() reads the currentEntry signal, so the title always
    // follows the live route — the read happens before any await
    document.title = `My App — ${hashRouter.getHash()}`;
  });

  return null;
}
```

#### Signals in React

The rules below come from the official `@preact/signals` documentation (`packages/react`, `packages/react-transform` and `eslint-plugin-signals` in the [preactjs/signals](https://github.com/preactjs/signals) repo).

**How components get subscribed.** Two equivalent ways:

1. **Babel transform** — add `@preact/signals-react/transform` to the Babel config (or use the Vite plugin equivalent): signal reads inside components are automatically wrapped, no code changes needed.
2. **Runtime hook** — call `useSignals()` at the top of every component that reads `.value`:

```tsx
import { useSignals } from '@preact/signals-react/runtime';
import { hashRouter } from '@front-utils/router';

function RouteInfo() {
  useSignals();

  // The bare call is enough when the Babel transform is unavailable:
  // the component subscribes to every signal read in it, and the hook
  // unsubscribes automatically on unmount.
  return <p>Current hash: {hashRouter.hash.value}</p>;
}
```

**Hooks for signal logic inside components** (per the official docs, never instantiate raw `signal()`/`computed()`/`effect()` in a component body — each render would create new instances and leak subscriptions):

```tsx
import { useSignal, useComputed, useSignalEffect } from '@preact/signals-react';

function SyncToggle() {
  // local state as a signal, not useState
  const inSync = useSignal(true);
  // derived values recompute automatically
  const count = useComputed(() => hashRouter.entries.value.length * (inSync.value ? 1 : 0));

  useSignalEffect(() => {
    console.log(`entries: ${count.value}`);
  });

  return <button onClick={() => inSync.value = !inSync.value}>sync: {String(inSync.value)}</button>;
}
```

**Pitfalls to avoid** (each is covered by a rule in `@preactjs/signals/eslint-plugin-signals`):

```tsx
// ❌ Reading .value outside a reactive scope yields a frozen snapshot
const routeName = hashRouter.hash.value; // module scope — read once, never refreshes
function Header() {
  return <h1>{routeName}</h1>;           // always stale
}

// ✅ Read inside the render of a subscribed component
function Header() {
  useSignals();
  return <h1>{hashRouter.hash.value}</h1>; // re-renders on every change
}

// The same applies to event handlers / useMemo / plain callbacks: those
// reads are snapshots — pass the signal object around and read .value reactively.

// ❌ A guard that doesn't read .value silently breaks tracking
useSignalEffect(() => {
  if (!hasFeatureFlag) return;          // plain variable — no re-run
  doSomething(hashRouter.hash.value);   // hash changes may be missed
});

// ✅ Reads that participate in tracking must touch .value themselves
useSignalEffect(() => {
  const enabled = hashRouter.state.value.enabled;  // tracked
  if (!enabled) return;
  doSomething(hashRouter.hash.value);
});

// ❌ Reading .value after `await` — tracking is synchronous and
//    suspended at each await point
useSignalEffect(async () => {
  const hash = hashRouter.hash.value;            // ✅ read before the await
  const entries = await fetchEntries(hash);
  console.log(hashRouter.hash.value);            // ❌ NOT tracked
});

// ✅ Pre-read what the async part needs, or mark the read untracked
// (untracked() comes from @preact/signals)
useSignalEffect(async () => {
  const hash = hashRouter.hash.value;
  const entries = await fetchEntries(hash);
  if (untracked(() => hashRouter.hash.value) !== hash) return; // stale response
  console.log(`entries for ${hash}:`, entries.length);
});
```

#### Using ClientRouter Component

The `ClientRouter` component provides a declarative way to define and manage routes in your React application:

```tsx
import React from 'react';
import { hashRouter, ClientRouter } from '@front-utils/router';

// Define page components
const HomePage = () => <div>Welcome to Home Page</div>;
const AboutPage = () => <div>About Us</div>;
const UserPage = ({ userId }) => <div>User Profile for User {userId}</div>;
const NotFoundPage = () => <div>404 - Page Not Found</div>;

function App() {

  // A plain object (Record) maps route patterns to components. A `Map` is
  // NOT supported: route discovery iterates over object keys.
  const routes = {
    home: HomePage,
    about: AboutPage,
    'user/:userId': UserPage
  };
  
  return (
    <div className="app">
      <nav>
        <button onClick={() => hashRouter.navigate('home')}>Home</button>
        <button onClick={() => hashRouter.navigate('about')}>About</button>
        <button onClick={() => hashRouter.navigate('user/123')}>User Profile</button>
      </nav>
      
      <main>
        <ClientRouter
          router={hashRouter}
          routes={routes}
          homeUrl="home"
          notFoundComponent={NotFoundPage}
          className="main-content"
        />
      </main>
    </div>
  );
}

export default App;
```

**Advanced ClientRouter Examples:**

1. **With TypeScript and route parameters:**

```tsx
import React from 'react';
import { hashRouter, ClientRouter } from '@front-utils/router';

interface UserProfileProps {
  userId: string;
  tab?: string;
}

interface ProductProps {
  categoryId: string;
  productId: string;
  color?: string;
}

// Page components
const HomePage = () => <div>Home Page</div>;
const AboutPage = () => <div>About Page</div>;
const UserProfile = ({ userId, tab = 'profile' }: UserProfileProps) => (
  <div>
    <h1>User {userId}</h1>
    <div>Current tab: {tab}</div>
  </div>
);
const ProductPage = ({ categoryId, productId, color }: ProductProps) => (
  <div>
    <h1>Product: {productId}</h1>
    <div>Category: {categoryId}</div>
    {color && <div>Selected color: {color}</div>}
  </div>
);
const NotFoundPage = () => <div>Page Not Found</div>;

function App() {

  // Route params arrive as props; the query string is available through
  // hashRouter.currentEntry.value.getQuery()
  const routes = {
    home: HomePage,
    about: AboutPage,
    'users/:userId': UserProfile,
    'products/:categoryId/:productId': ProductPage
  };
  
  return (
    <div>
      <nav>
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
      </nav>
      
      <ClientRouter
        router={hashRouter}
        routes={routes}
        homeUrl="home"
        notFoundComponent={NotFoundPage}
      />
    </div>
  );
}
```

2. **With React Context for better organization:**

```tsx
import React, { createContext, useContext } from 'react';
import { hashRouter, ClientRouter } from '@front-utils/router';

// Create context
const RouterContext = createContext(hashRouter);

// Router provider component
function RouterProvider({ children }) {
  return (
    <RouterContext.Provider value={hashRouter}>
      {children}
    </RouterContext.Provider>
  );
}

// Custom hook for router access
function useRouter() {
  return useContext(RouterContext);
}

// Navigation component
function Navigation() {
  const router = useRouter();
  
  return (
    <nav>
      <button onClick={() => router.navigate('home')}>Home</button>
      <button onClick={() => router.navigate('dashboard')}>Dashboard</button>
      <button onClick={() => router.navigate('settings')}>Settings</button>
      {router.canGoBack.value && (
        <button onClick={() => router.goBack()}>Back</button>
      )}
    </nav>
  );
}

// Page components
const HomePage = () => <h1>Home</h1>;
const DashboardPage = () => <h1>Dashboard</h1>;
const ProfilePage = ({ userId }) => <h1>Profile: {userId}</h1>;
const SettingsPage = () => <h1>Settings</h1>;
const NotFoundPage = () => <h1>Page Not Found</h1>;

// Main app component
function MainApp() {
  const router = useRouter();

  // Plain object, not a Map — keep it module-scope or stable-referenced
  // (route groups are compared by content, inline objects are fine)
  const routes = {
    home: HomePage,
    dashboard: DashboardPage,
    'profile/:userId': ProfilePage,
    settings: SettingsPage
  };
  
  return (
    <div className="app">
      <Navigation />
      <ClientRouter
        router={router}
        routes={routes}
        homeUrl="home"
        notFoundComponent={NotFoundPage}
      />
    </div>
  );
}

// Root component with provider
export default function App() {
  return (
    <RouterProvider>
      <MainApp />
    </RouterProvider>
  );
}
```

3. **With Code Splitting:**

```tsx
import React, { Suspense, lazy } from 'react';
import { hashRouter, ClientRouter } from '@front-utils/router';

// Lazy loaded components
const HomePage = lazy(() => import('./pages/Home'));
const AboutPage = lazy(() => import('./pages/About'));
const UserProfilePage = lazy(() => import('./pages/UserProfile'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));

// Loading component
const Loading = () => <div className="loading">Loading...</div>;

function App() {  
  // Plain object route map (`Map` is not supported)
  const routes = {
    home: HomePage,
    about: AboutPage,
    'user/:userId': UserProfilePage
  };
  
  return (
    <div className="app">
      <nav>
        <button onClick={() => hashRouter.navigate('home')}>Home</button>
        <button onClick={() => hashRouter.navigate('about')}>About</button>
        <button onClick={() => hashRouter.navigate('user/123')}>User Profile</button>
      </nav>
      
      <Suspense fallback={<Loading />}>
        <ClientRouter
          router={hashRouter}
          routes={routes}
          homeUrl="home"
          notFoundComponent={NotFoundPage}
        />
      </Suspense>
    </div>
  );
}
```

#### Vue Integration

```javascript
// router.js
import { hashRouter } from '@front-utils/router';
import { ref, readonly, computed } from 'vue';

// Initialize the router
const unsubscribe = hashRouter.create({
  onChange: () => {
    // Vue's reactivity will pick up changes through the computed properties
  },
  config: {
    homeUrl: 'home',
    routeNames: ['home', 'about', 'contact', 'users/:id']
  }
});

// Create reactive references to router state
const currentHash = computed(() => hashRouter.getHash());
const currentState = computed(() => hashRouter.getState() || {});
const routeParams = computed(() => hashRouter.currentEntry.value.getParams());
const queryParams = computed(() => hashRouter.currentEntry.value.getQuery());
const canGoBack = computed(() => hashRouter.canGoBack.value);

export default {
  currentHash: readonly(currentHash),
  currentState: readonly(currentState),
  routeParams: readonly(routeParams),
  queryParams: readonly(queryParams),
  canGoBack: readonly(canGoBack),
  navigate: hashRouter.navigate,
  goBack: hashRouter.goBack,
  destroy: unsubscribe
};

// App.vue
<template>
  <div>
    <nav>
      <button @click="navigate('home')">Home</button>
      <button @click="navigate('about')">About</button>
      <button @click="navigate('contact')">Contact</button>
      <button @click="navigate(`users/${userId}`)">User Profile</button>
      <button v-if="canGoBack" @click="goBack">Back</button>
    </nav>
    
    <component :is="currentComponent" 
               :params="routeParams" 
               :query="queryParams"
               v-bind="currentState"></component>
  </div>
</template>

<script>
import router from './router';
import HomePage from './components/HomePage.vue';
import AboutPage from './components/AboutPage.vue';
import ContactPage from './components/ContactPage.vue';
import UserPage from './components/UserPage.vue';

export default {
  setup() {
    const userId = '123'; // Example user ID
    
    const getComponent = () => {
      const hash = router.currentHash.value;
      
      if (hash === 'home') return HomePage;
      if (hash === 'about') return AboutPage;
      if (hash === 'contact') return ContactPage;
      if (hash.startsWith('users/')) return UserPage;
      
      return HomePage; // Default
    };
    
    return {
      userId,
      currentComponent: computed(() => getComponent()),
      routeParams: router.routeParams,
      queryParams: router.queryParams,
      currentState: router.currentState,
      canGoBack: router.canGoBack,
      navigate: router.navigate,
      goBack: router.goBack
    };
  }
};
</script>
```

## Key Behaviors

### Multiple instances and shared history

`window.history` is a single, global resource. All `HashRouter`/`HashNavigation` instances created over the same underlying navigation share one history model:

- The `hashRouter`/`hashNavigation` singletons share their model by design. When a page (e.g. an `ClientRouter`) unmounts, `destroy()` keeps the model intact so a later `create()` reconciles to the current URL — this is what makes **back/forward across page groups** work correctly instead of inverting or duplicating entries.
- `create()`/`destroy()` are ref-counted: concurrently mounted instances share one `hashchange` listener and one model, and destroying one instance does not tear down the others.
- On `create()`, the current URL is matched against the preserved entries and the history index is restored; an unknown URL starts a fresh model.

### Hash normalization

Hashes passed to `navigate()`, `updateCurrentEntryHash()` and `homeUrl` are normalized: leading `#`/`/` and trailing `/` are stripped, so `'/home'`, `'#/home'`, `'home/'` and `'home'` are equivalent and always produce `#/home`.

### Subscription navigation statuses

Callbacks passed to `create().onChange` and `subscribe()` receive a third argument, `navigationStatus`, describing the delivery for the current entry:

- `notStarted` - the router config has not been applied yet (no `create()` ran, or the subscriber attached before it). The router cannot judge whether the hash exists, and this is the status delivered on the initial synchronous call. Router API methods (`getHash()`, `hasPage()`, `getState()`, ...) remain safe to call.
- `success` - the current hash matches a configured route.
- `notfound` - no configured route matches the current hash.

When a subscriber attaches before the first `create()`, applying the config re-emits an accurate status for the same entry (e.g. `notStarted` -> `success` for a valid deep link) without emitting extra events while the entry changes.

### Route matching

- Route patterns are matched **first match wins** — declare more specific routes (e.g. `users/me`) before parameterized ones (`users/:id`).
- Patterns and hashes are normalized before matching: the query string is dropped and leading/trailing slashes are stripped from both sides, so `/users/:id` and `users/:id` are equivalent. The hash exposed by the router never carries a leading slash.
- Regex special characters in static segments are escaped, so a dot in `v1.list/:id` matches a literal dot.
- Route parameter values and query keys/values are URL-decoded; values may contain `=` (only the first `=` is treated as a separator).

### ClientRouter

`ClientRouter` re-creates the underlying router only when the route group (`routes`/`homeUrl` content) actually changes — passing an inline `routes` object each render does not reset navigation state. Route components are switched by identity and re-render in place on parameter-only navigation.

## Contract Interfaces

The library is built on the following TypeScript interfaces. The source of truth is [`packages/router/src/types.ts`](https://github.com/front-util/router/blob/main/packages/router/src/types.ts) — keep this section in sync when changing the public surface:

### HashNavigation Interface

```typescript
export interface HashNavigation {
  // Public signals
  currentEntry: ReadonlySignal<NavigationHistoryEntry>;
  prevEntry: ReadonlySignal<NavigationHistoryEntry | null>;
  entries: ReadonlySignal<NavigationHistoryEntry[]>;
  canGoBack: ReadonlySignal<boolean>;
  canGoForward: ReadonlySignal<boolean>;

  // Navigation methods
  navigate: (hash: string, options?: NavigationOptions) => void;
  traverseTo: (key: string, options?: NavigationOptions) => void;
  back: VoidFunction;
  goToPrev: VoidFunction;
  forward: VoidFunction;
  updateCurrentEntry: (options?: NavigationOptions, hash?: string) => void;

  // Subscription method
  subscribe: (
    callback: (
      entry: NavigationHistoryEntry,
      prevEntry: NavigationHistoryEntry | null,
      hash: string
    ) => void
  ) => VoidFunction;

  // Init
  create: () => void;
  // Cleanup
  destroy: () => void;

  updateCurrentEntryHash: (hash: string, newState?: NavigationState | null) => void;
}
```

### HashRouter Interface

```typescript
export interface HashRouter extends Pick<HashNavigation, 'entries' | 'canGoBack' | 'canGoForward'> {
  _navigation: HashNavigation;
  currentEntry: ReadonlySignal<RouterHistoryEntry>;
  prevEntry: ReadonlySignal<NavigationHistoryEntry | null>;
  state: ReadonlySignal<NavigationState>;
  hash: ReadonlySignal<string>;
  create: (config: SubscribeChangeConfig) => VoidFunction;
  subscribe: (callback: NavigationCb) => VoidFunction;
  navigate: (hash: string, state?: Record<string, unknown>) => void;
  navigateTo: (pattern: string, params?: Record<string, string | number>, state?: Record<string, unknown>) => void;
  replaceState: (config?: { state?: Record<string, unknown>; hash?: string; }) => void;
  goBack: VoidFunction;
  goToPrev: VoidFunction;
  getHash: () => string;
  getState: <T = NavigationState>() => T | undefined;
  hasPage: (hash?: string) => boolean;
  destroy: VoidFunction;
  getConfig: () => InitializeRouterConfig | null;
}
```

### Router History Entry Interface

```typescript
export interface RouterHistoryEntry extends NavigationHistoryEntry {
  pattern?: string;
  getParams: <T extends Record<string, string> = Record<string, string>>() => T;
  getQuery : <T extends QueryParams>() => T,
}
```

### Configuration Interfaces

```typescript
export type NavigationCb = (
  entry: NavigationHistoryEntry,
  prev: NavigationHistoryEntry | null,
  navigationStatus: 'success' | 'notfound' | 'notStarted'
) => void;

export interface InitializeRouterConfig {
  homeUrl: string;
  routeNames: string[];
}

export interface SubscribeChangeConfig {
  onChange: NavigationCb;
  config: InitializeRouterConfig;
}
```

### Navigation History Interfaces

```typescript
export type NavigationState = Record<string, unknown>;

export interface NavigationHistoryEntry {
  url: string;
  key: string;
  id: string;
  index: number;
  sameDocument: boolean;
  state?: any;
  hash: string;
}

export interface NavigationOptions {
  state?: unknown;
  info?: unknown;
}

export interface QueryParams {
  [key: string]: string
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

**Hash changes not being detected**
- Make sure the router is initialized before any navigation occurs
- Check that the route names are correctly defined in your configuration

**State not persisting between navigations**
- Ensure you're using `navigate()` with state parameter correctly
- Verify you're retrieving state with `getState()` method
- Navigation state survives a full page reload: it is seeded from the native `history.state` on boot. If the state is gone after a reload, check that no other code calls `history.replaceState(undefined, ...)` for the entry (this clears the native state)

**Route parameters not working**
- Ensure your route patterns are correctly defined in the `routeNames` array
- Check that you're accessing parameters with `getParams()` method from the router entry
- `getParams()` resolves against the config applied by `create()`, so it returns `{}` until the router has been created — this matters when a component reads `currentEntry` during its first render, before `create()` runs in an effect
- A `pattern`-less `currentEntry` (no route matched) always yields `{}` — check `hasPage()` and that the pattern you registered is reachable from the current hash

**Conflicts with other routers**
- This router uses hash-based navigation, so avoid using other hash-change listeners
- If using with another framework's router, ensure they're not both handling the same routes

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

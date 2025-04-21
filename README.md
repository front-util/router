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
  - [Usage Examples](#usage-examples)
    - [Basic Setup](#basic-setup)
    - [Advanced Usage](#advanced-usage)
    - [Handling Route Changes](#handling-route-changes)
    - [State Management](#state-management)
    - [Route Parameters and Queries](#route-parameters-and-queries)
    - [TypeScript Usage](#typescript-usage)
    - [Integration with Frameworks](#integration-with-frameworks)
      - [React Integration](#react-integration)
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

## Installation

```bash
# Using npm
npm install @front-utils/router

# Using yarn
yarn add @front-utils/router

# Using bun
bun add @front-utils/router
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

> It almost completely implements the native object **window.navigation**

#### Properties

- `currentEntry` - A read-only signal containing the current history entry
- `entries` - A read-only signal containing all history entries
- `canGoBack` - A read-only signal indicating if navigation backward is possible
- `canGoForward` - A read-only signal indicating if navigation forward is possible

#### Methods

- `navigate(hash, options)` - Navigate to a new hash, optionally with state
- `traverseTo(key, options)` - Navigate to a specific history entry by key
- `back(options)` - Navigate backward in history
- `forward(options)` - Navigate forward in history
- `reload(options)` - Reload the current entry
- `updateCurrentEntry(options, hash)` - Update the state of the current entry, optionally updating the hash
- `updateCurrentEntryHash(hash)` - Update only the hash of the current entry
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
- `subscribe(callback)` - Subscribe to history changes
- `navigate(hash, state)` - Navigate to a specific hash with optional state
- `replaceState(config)` - Replace the current state and/or hash
- `goBack()` - Navigate back in history
- `goToPrev()` - Alias for goBack
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

## Usage Examples

### Basic Setup

```typescript
import { hashRouter } from '@front-utils/router';

// Initialize the router with routes configuration
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

// Clean up when your app is destroyed
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
  
  // Simple route-based content rendering
  switch (hash) {
    case 'home':
      appContainer.innerHTML = '<h1>Home Page</h1>';
      break;
    case 'about':
      appContainer.innerHTML = '<h1>About Us</h1>';
      break;
    case 'contact':
      appContainer.innerHTML = '<h1>Contact Us</h1>';
      break;
    default:
      appContainer.innerHTML = '<h1>Page Not Found</h1>';
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
    state: { ...hashRouter.getState(), options } 
  });
}

// Example of accessing state from the current entry
function getCurrentProductId() {
  const state = hashRouter.getState();
  return state?.productId;
}
```

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

// Helper function to access params in components
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

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { hashRouter } from '@front-utils/router';

// Custom hook for using the router
function useHashRouter() {
  const [routerInstance, setRouterInstance] = useState(null);
  
  // Initialize once
  useEffect(() => {
    const unsubscribe = hashRouter.create({
      onChange: (location) => {
        // Force a re-render on location change
        setRouterInstance({});
      },
      config: {
        homeUrl: 'home',
        routeNames: ['home', 'users', 'users/:id', 'settings']
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Return consistent references to current values and methods
  return useMemo(() => ({
    currentRoute: hashRouter.getHash(),
    routeState: hashRouter.getState() || {},
    currentEntry: hashRouter.currentEntry.value,
    params: hashRouter.currentEntry.value.getParams(),
    query: hashRouter.currentEntry.value.getQuery(),
    navigate: hashRouter.navigate,
    goBack: hashRouter.goBack,
    canGoBack: hashRouter.canGoBack.value
  }), [routerInstance]);
}

// Example component
function App() {
  const { currentRoute, params, query, navigate, goBack, canGoBack } = useHashRouter();
  
  return (
    <div>
      <nav>
        <button onClick={() => navigate('home')}>Home</button>
        <button onClick={() => navigate('users')}>Users</button>
        <button onClick={() => navigate('settings')}>Settings</button>
        {canGoBack && <button onClick={goBack}>Back</button>}
      </nav>
      
      <main>
        {currentRoute === 'home' && <HomePage />}
        {currentRoute === 'users' && !params.id && <UsersPage page={query.page} />}
        {currentRoute === 'users' && params.id && <UserDetailsPage userId={params.id} />}
        {currentRoute === 'settings' && <SettingsPage />}
      </main>
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

## Contract Interfaces

The library is built on the following TypeScript interfaces:

### HashNavigation Interface

```typescript
export interface HashNavigation {
  // Public signals
  currentEntry: ReadonlySignal<NavigationHistoryEntry>;
  entries: ReadonlySignal<NavigationHistoryEntry[]>;
  canGoBack: ReadonlySignal<boolean>;
  canGoForward: ReadonlySignal<boolean>;
  
  // Navigation methods
  navigate: (hash: string, options?: NavigationOptions) => NavigationResult;
  traverseTo: (key: string, options?: NavigationOptions) => NavigationResult | null;
  back: (options?: NavigationOptions) => NavigationResult | null;
  forward: (options?: NavigationOptions) => NavigationResult | null;
  reload: (options?: NavigationOptions) => NavigationResult;
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

  updateCurrentEntryHash: (hash: string) => void;
}
```

### HashRouter Interface

```typescript
export interface HashRouter extends Pick<HashNavigation, 'entries' | 'canGoBack' | 'canGoForward'> {
  _navigation: HashNavigation;
  currentEntry: ReadonlySignal<RouterHistoryEntry>;
  state: ReadonlySignal<NavigationState>;
  hash: ReadonlySignal<string>;
  create: (config: SubscribeChangeConfig) => VoidFunction;
  subscribe: (callback: (update: NavigationHistoryEntry, prevLocation?: NavigationHistoryEntry | null) => void) => VoidFunction;
  navigate: (hash: string, state?: Record<string, unknown>) => NavigationResult;
  replaceState: (config?: {state?: Record<string, unknown>; hash?: string;}) => void;
  goBack: VoidFunction;
  goToPrev: VoidFunction;
  getHash: () => string;
  getState: () => NavigationState | undefined;
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
export interface InitializeRouterConfig {
  homeUrl: string;
  routeNames: string[];
}

export interface SubscribeChangeConfig {
  onChange: (loc: NavigationHistoryEntry) => void;
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

export interface NavigationResult {
  committed: Promise<NavigationHistoryEntry>;
  finished: Promise<NavigationHistoryEntry>;
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

**Route parameters not working**
- Ensure your route patterns are correctly defined in the `routeNames` array
- Check that you're accessing parameters with `getParams()` method from the router entry

**Conflicts with other routers**
- This router uses hash-based navigation, so avoid using other hash-change listeners
- If using with another framework's router, ensure they're not both handling the same routes

## License

This project is licensed under the MIT License - see the LICENSE file for details.
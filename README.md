
# Router Utility

A lightweight, flexible hash-based router implementation for modern web applications.

## Table of Contents

- [Router Utility](#router-utility)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Installation](#installation)
  - [API Documentation](#api-documentation)
    - [HashNavigation](#hashnavigation)
      - [Properties](#properties)
      - [Methods](#methods)
    - [HashRouter](#hashrouter)
      - [Properties](#properties-1)
      - [Methods](#methods-1)
  - [Usage Examples](#usage-examples)
    - [Basic Setup](#basic-setup)
    - [Advanced Usage](#advanced-usage)
    - [Handling Route Changes](#handling-route-changes)
    - [State Management](#state-management)
    - [Integration with Frameworks](#integration-with-frameworks)
      - [React Integration](#react-integration)
      - [Vue Integration](#vue-integration)
  - [Contract Interfaces](#contract-interfaces)
    - [HashNavigation Interface](#hashnavigation-interface)
    - [HashRouter Interface](#hashrouter-interface)
    - [Configuration Interfaces](#configuration-interfaces)
    - [Navigation History Interfaces](#navigation-history-interfaces)
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
- `updateCurrentEntry(delta)` - Update the state of the current entry
- `addEventListener(type, listener)` - Add an event listener
- `removeEventListener(type, listener)` - Remove an event listener
- `destroy()` - Clean up all listeners and resources

### HashRouter

HashRouter provides a higher-level API for common routing operations, with easier configuration and initialization.

#### Properties

- `navigation` - Reference to the underlying HashNavigation instance

#### Methods

- `initializeAndSubscribeOnChange(config)` - Initialize the router and subscribe to location changes
- `subscribeOnListenHistory(callback)` - Subscribe to history changes
- `navigate(hash, state)` - Navigate to a specific hash with optional state
- `replaceState(config)` - Replace the current state and/or hash
- `goBack()` - Navigate back in history
- `goToPrev()` - Alias for goBack
- `isExistPageByCurrentHash(hash?)` - Check if a page exists in configured routes

## Usage Examples

### Basic Setup

```typescript
import { hashRouter } from '@front-utils/router';

// Initialize the router with routes configuration
const unsubscribe = hashRouter.initializeAndSubscribeOnChange({
  onChange: (location) => {
    console.log('Route changed:', location.getHash());
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
hashRouter.initializeAndSubscribeOnChange({
  onChange: (location) => {
    const hash = location.getHash();
    const state = location.getState();
    
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
if (hashRouter.isExistPageByCurrentHash()) {
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
  const hash = location.getHash();
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
hashRouter.initializeAndSubscribeOnChange({
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
hashRouter.initializeAndSubscribeOnChange({
  onChange: (location) => {
    const hash = location.getHash();
    const state = location.getState();
    
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
    state: { ...hashRouter.navigation.currentEntry.value.getState(), options } 
  });
}

// Example of accessing state from the current entry
function getCurrentProductId() {
  const state = hashRouter.navigation.currentEntry.value.getState();
  return state?.productId;
}
```

### Integration with Frameworks

#### React Integration

```tsx
import React, { useState, useEffect } from 'react';
import { hashRouter } from '@front-utils/router';

// Custom hook for using the router
function useHashRouter() {
  const [currentRoute, setCurrentRoute] = useState('');
  const [routeState, setRouteState] = useState({});

  useEffect(() => {
    const unsubscribe = hashRouter.initializeAndSubscribeOnChange({
      onChange: (location) => {
        setCurrentRoute(location.getHash());
        setRouteState(location.getState() || {});
      },
      config: {
        homeUrl: 'home',
        routeNames: ['home', 'users', 'settings']
      }
    });
    
    return unsubscribe;
  }, []);

  return {
    currentRoute,
    routeState,
    navigate: hashRouter.navigate,
    goBack: hashRouter.goBack
  };
}

// Example component
function App() {
  const { currentRoute, routeState, navigate, goBack } = useHashRouter();
  
  return (
    <div>
      <nav>
        <button onClick={() => navigate('home')}>Home</button>
        <button onClick={() => navigate('users')}>Users</button>
        <button onClick={() => navigate('settings')}>Settings</button>
        <button onClick={goBack}>Back</button>
      </nav>
      
      <main>
        {currentRoute === 'home' && <HomePage />}
        {currentRoute === 'users' && <UsersPage userId={routeState.userId} />}
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
import { ref, readonly } from 'vue';

const currentRoute = ref('');
const routeState = ref({});

// Initialize the router
const unsubscribe = hashRouter.initializeAndSubscribeOnChange({
  onChange: (location) => {
    currentRoute.value = location.getHash();
    routeState.value = location.getState() || {};
  },
  config: {
    homeUrl: 'home',
    routeNames: ['home', 'about', 'contact']
  }
});

export default {
  currentRoute: readonly(currentRoute),
  routeState: readonly(routeState),
  navigate: hashRouter.navigate,
  goBack: hashRouter.goBack
};

// App.vue
<template>
  <div>
    <nav>
      <button @click="navigate('home')">Home</button>
      <button @click="navigate('about')">About</button>
      <button @click="navigate('contact')">Contact</button>
      <button @click="goBack">Back</button>
    </nav>
    
    <component :is="currentComponent" v-bind="routeState"></component>
  </div>
</template>

<script>
import router from './router';
import HomePage from './components/HomePage.vue';
import AboutPage from './components/AboutPage.vue';
import ContactPage from './components/ContactPage.vue';

export default {
  setup() {
    const getComponent = () => {
      switch (router.currentRoute.value) {
        case 'home': return HomePage;
        case 'about': return AboutPage;
        case 'contact': return ContactPage;
        default: return HomePage;
      }
    };
    
    return {
      currentComponent: computed(() => getComponent()),
      routeState: router.routeState,
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
  updateCurrentEntry: (delta: Partial<NavigationState>) => void;
  
  // Event handlers
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
  
  // Cleanup
  destroy: () => void;
}
```

### HashRouter Interface

```typescript
export interface HashRouter {
  navigation: HashNavigation;
  initializeAndSubscribeOnChange: (config: SubscribeChangeConfig) => VoidFunction;
  subscribeOnListenHistory: (callback: (update: NavigationHistoryEntry, prevLocation?: NavigationHistoryEntry | null) => void) => VoidFunction;
  navigate: (hash: string, state?: Record<string, unknown>) => void;
  replaceState: (config?: {state?: Record<string, unknown>; hash?: string;}) => void;
  goBack: VoidFunction;
  goToPrev: VoidFunction;
  isExistPageByCurrentHash: (hash?: string) => boolean;
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
  getState<T extends NavigationState = NavigationState>(): T | undefined;
  getHash(): string;
}

export interface NavigationResult {
  committed: Promise<NavigationHistoryEntry>;
  finished: Promise<NavigationHistoryEntry>;
}

export interface NavigationOptions {
  state?: unknown;
  info?: unknown;
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

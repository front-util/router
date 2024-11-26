/* eslint-disable @typescript-eslint/no-explicit-any */
type NavigationEvtTypes = 'navigate' | 'navigatesuccess' | 'navigateerror' | 'currententrychange';

interface Navigation {
    readonly currentEntry: NavigationHistoryEntry | null;
    entries(): NavigationHistoryEntry[];
    updateCurrentEntry(options: NavigationUpdateCurrentEntryOptions): void;
    navigate(url: string, options?: NavigationNavigateOptions): NavigationHistoryEntry;
    reload(options?: NavigationReloadOptions): NavigationHistoryEntry;
    traverseTo(key: string, options?: NavigationTraverseOptions): NavigationHistoryEntry;
    back(options?: NavigationBackOptions): NavigationHistoryEntry;
    forward(options?: NavigationForwardOptions): NavigationHistoryEntry;
    onnavigate: ((this: Navigation, ev: NavigationEvent) => any) | null;
    onnavigatesuccess: ((this: Navigation, ev: NavigationEvent) => any) | null;
    onnavigateerror: ((this: Navigation, ev: NavigationEvent) => any) | null;
    addEventListener: (type: NavigationEvtTypes, cb: (evt: NavigationEvent) => void) => void;
    removeEventListener: (type: NavigationEvtTypes, cb: (evt: NavigationEvent) => void) => void;
  }
  
interface NavigationHistoryEntry {
    readonly key: string;
    readonly id: string;
    readonly url: string;
    readonly index: number;
    readonly sameDocument: boolean;
    getState(): any;
  }
  
interface NavigationUpdateCurrentEntryOptions {
    state?: any;
  }
  
interface NavigationNavigateOptions {
    state?: any;
    info?: any;
  }
  
interface NavigationReloadOptions {
    state?: any;
  }
  
interface NavigationTraverseOptions {
    state?: any;
  }
  
interface NavigationBackOptions {
    state?: any;
  }
  
interface NavigationForwardOptions {
    state?: any;
  }

interface NavigationInterceptOptions {
    handler?: () => void;
    focusReset?: 'after-transition' | 'manual';
  }
  
interface NavigationEvent extends Event {
    canIntercept: boolean;
    destination: NavigationDestination;
    formData: FormData | null;
    hashChange: boolean;
    info: any;
    navigationType: NavigationType;
    signal: AbortSignal;
    userInitiated: boolean;
    target: Navigation;
    currentTarget: Navigation;
    intercept(options?: NavigationInterceptOptions): void;
    scroll(): void;
  }
  
type NavigationType = 'reload' | 'push' | 'replace' | 'traverse';
  
interface NavigationDestination {
    readonly key: string;
    readonly id: string;
    readonly url: string;
    readonly index: number;
    readonly sameDocument: boolean;
    getState(): any;
  }

declare interface Window {
    navigation: Navigation;
}
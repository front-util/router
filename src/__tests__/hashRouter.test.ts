/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hashRouter, createHashRouter } from '../core/hashRouter';
import { createHashNavigation } from '../core/hashNavigation';

describe('hashRouter', () => {
    let router = hashRouter;
    let onChange: any;
    
    // Original window methods we'll be mocking
    let originalHistoryPushState: typeof window.history.pushState;
    let originalHistoryReplaceState: typeof window.history.replaceState;
    let originalHistoryBack: typeof window.history.back;
    let originalHistoryForward: typeof window.history.forward;
    let originalHistoryGo: typeof window.history.go;

    beforeEach(() => {
        // Store original methods
        originalHistoryPushState = window.history.pushState;
        originalHistoryReplaceState = window.history.replaceState;
        originalHistoryBack = window.history.back;
        originalHistoryForward = window.history.forward;
        originalHistoryGo = window.history.go;
        
        // Mock window.history methods
        window.history.pushState = vi.fn((state, _, url) => {
            Object.defineProperty(window.history, 'state', {
                value   : state,
                writable: true,
            });
            if(url) {
                // Update location.hash if URL contains a hash
                const hashMatch = url.toString().match(/#(.*)$/);

                if(hashMatch) {
                    window.location.hash = hashMatch[0];
                }
            }
        });
        
        window.history.replaceState = vi.fn((state, _, url) => {
            Object.defineProperty(window.history, 'state', {
                value   : state,
                writable: true,
            }); 
            
            if(url) {
                // Update location.hash if URL contains a hash
                const hashMatch = url.toString().match(/#(.*)$/);

                if(hashMatch) {
                    window.location.hash = hashMatch[0];
                }
            }
        });
        
        window.history.back = vi.fn(() => {
            // This would be called by tests but doesn't actually navigate in jsdom
        });
        
        window.history.forward = vi.fn(() => {
            // This would be called by tests but doesn't actually navigate in jsdom
        });
        
        window.history.go = vi.fn(() => {
            // This would be called by tests but doesn't actually navigate in jsdom
        });

        // Start with empty hash
        window.location.hash = '';
        
        onChange = vi.fn();

        router = createHashRouter(createHashNavigation());
    });
  
    afterEach(() => {
        // Restore original methods
        window.history.pushState = originalHistoryPushState;
        window.history.replaceState = originalHistoryReplaceState;
        window.history.back = originalHistoryBack;
        window.history.forward = originalHistoryForward;
        window.history.go = originalHistoryGo;
        
        // Clear any event listeners
        router.destroy();
        vi.clearAllMocks();
    });
  
    describe('create', () => {
        it('should initialize the router with provided routes', () => {
            const config = {
                homeUrl   : 'home',
                routeNames: ['home', 'about', 'contact'],
            };
            const unsubscribe = router.create({
                onChange,
                config,
            });
      
            expect(typeof unsubscribe).toBe('function');
            expect(onChange).toHaveBeenCalledTimes(1);
            
            expect(router.getHash()).toBe('home');
            expect(router.getConfig()).toBe(config);
        });

        it('should initialize twice', () => {
            const config = {
                homeUrl   : 'home',
                routeNames: ['home', 'about', 'contact'],
            };
            const config2 = {
                homeUrl   : 'about',
                routeNames: ['home', 'about', 'contact'],
            };
            const onChange2 = vi.fn();
            const onChange3 = vi.fn();

            router.create({
                onChange,
                config,
            });
            router.subscribe(onChange3);

            router.destroy();

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange3).toHaveBeenCalledTimes(1);
            expect(router.getHash()).toBe('home');
            expect(router.getConfig()).toBe(config);

            onChange.mockReset();
            onChange3.mockReset();

            router.create({
                onChange: onChange2,
                config  : config2,
            });
      
            expect(onChange2).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledTimes(0);
            expect(router.getHash()).toBe('home');
            expect(router.getConfig()).toBe(config2);
            expect(router.canGoBack.value).toBeFalsy();
            expect(router.canGoForward.value).toBeFalsy();
            expect(router.entries.value.length).toEqual(1);

            router.navigate('contact');

            expect(onChange3).toHaveBeenCalledTimes(0);
        });
    
        it('should set home hash if current hash is empty', () => {      
            router.create({
                onChange,
                config: {
                    homeUrl   : 'dashboard',
                    routeNames: ['dashboard', 'profile', 'settings'],
                },
            });
      
            expect(router.getHash()).toEqual('dashboard');
        });
    
        it('should replace with home URL if current hash is not in routeNames', () => {
            // First navigate to an invalid route
            window.location.hash = '#invalid-route';
            
            router.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about', 'contact'],
                },
            });
      
            expect(router.getHash()).toEqual('home');
        });

        it('should set correct home URL if current hash has addition hash', () => {
            window.location.hash = '#/#home';
            const localRouter = createHashRouter(createHashNavigation());
            
            localRouter.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about', 'contact'],
                },
            });
      
            expect(localRouter.getHash()).toEqual('home');
            expect(localRouter.entries.value.length).toEqual(1);
        });

        it('should set correct home URL if current hash has hash', () => {
            window.location.hash = '#/about';
            const localRouter = createHashRouter(createHashNavigation());

            localRouter.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about', 'contact'],
                },
            });
      
            expect(localRouter.getHash()).toEqual('about');
            expect(localRouter.entries.value.length).toEqual(1);
        });

        it('should set correct home URL if current hash has hash after destroy', () => {
            window.location.hash = '#/about';

            router.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about', 'contact'],
                },
            });
      
            expect(router.getHash()).toEqual('about');
            expect(router.entries.value.length).toEqual(1);
        });
    
        it('should not call onChange for the same URL twice', () => {
            router.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about'],
                },
            });
      
            expect(onChange).toHaveBeenCalledTimes(1);

            // Simulate a navigation event with the same URL
            router.navigate('home');
      
            expect(onChange).toHaveBeenCalledTimes(1);
        });

        it('should set home correct hash if router with params', () => {      
            window.location.hash = '#/profile/100';
            const localRouter = createHashRouter(createHashNavigation());

            localRouter.create({
                onChange,
                config: {
                    homeUrl   : 'dashboard',
                    routeNames: ['dashboard', 'profile/:id'],
                },
            });
      
            expect(localRouter.getHash()).toEqual('profile/100');
            expect(localRouter.entries.value.length).toEqual(1);
            expect(localRouter.currentEntry.value.hash).toEqual('profile/100');
            expect(localRouter.currentEntry.value.getParams()).toEqual({id: '100',});
            expect(onChange).toHaveBeenCalledTimes(1);
        });
    });

    describe('destroy', () => {
        it('should correct clear router data after destroy', () => {
            router.create({
                onChange,
                config: {
                    homeUrl   : 'dashboard',
                    routeNames: ['dashboard', 'profile', 'test', 'home/:id'],
                },
            });
            router.navigate('test');
            router.navigate('profile');
            router.navigate('dashboard');
            router.navigate('home/100');
    
            router.destroy();
            onChange.mockReset();
    
            expect(router.currentEntry.value.hash).toEqual('home/100');
            expect(router.currentEntry.value.getParams()).toEqual({id: '100',});
            expect(router.currentEntry.value.url).toEqual('http://localhost:3000/#/home/100');
            expect(router.currentEntry.value.pattern).toEqual('home/:id');
            expect(router.entries.value.length).toEqual(1);

            router.navigate('test');

            expect(onChange).toHaveBeenCalledTimes(0);
        });
    });
  
    describe('navigate', () => {
        it('should navigate to specified hash', () => {
            const navigateSpy = vi.spyOn(router._navigation, 'navigate');
      
            router.navigate('about');
      
            expect(navigateSpy).toHaveBeenCalledWith('about', expect.objectContaining({
                state: undefined,
            }));
        });
    
        it('should navigate with state', () => {
            const state = { id: 123, name: 'test', };
            const navigateSpy = vi.spyOn(router._navigation, 'navigate');
      
            router.navigate('profile', state);
      
            expect(navigateSpy).toHaveBeenCalledWith('profile', expect.objectContaining({
                state,
            }));
        });
    });
  
    describe('hasPage', () => {
        it('should return true for valid routes', () => {
            router.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about', 'contact'],
                },
            });
      
            expect(router.hasPage('home')).toBe(true);
            expect(router.hasPage('about')).toBe(true);
            expect(router.hasPage('contact')).toBe(true);
        });

        it('should return true for route with params', () => {
            router.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'profile/:id' ],
                },
            });
      
            expect(router.hasPage('home')).toBe(true);
            expect(router.hasPage('profile/1000')).toBe(true);
        });
    
        it('should return false for invalid routes', () => {
            router.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about', 'contact'],
                },
            });
      
            expect(router.hasPage('invalid')).toBe(false);
            expect(router.hasPage('profile')).toBe(false);
        });
    
        it('should use current hash if no hash is provided', () => {
            router.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about', 'contact'],
                },
            });
      
            // Current hash should be 'home' after initialization
            expect(router.hasPage()).toBe(true);
      
            // Navigate to an invalid page
            router.navigate('invalid');
      
            expect(router.hasPage()).toBe(false);
        });
    
        it('should handle hashes with leading #', () => {
            router.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about', 'contact'],
                },
            });
      
            expect(router.hasPage('#home')).toBe(true);
            expect(router.hasPage('#invalid')).toBe(false);
        });
    });
  
    describe('subscribe', () => {
        it('should subscribe to history changes', () => {
            const callback = vi.fn();
            const unsubscribe = router.subscribe(callback);
      
            expect(typeof unsubscribe).toBe('function');
            expect(callback).toHaveBeenCalledTimes(1);
      
            // Trigger navigation event
            router.navigate('about');
      
            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    url: expect.stringContaining('about'),
                }),
                expect.anything(),
                'notfound'
            );
        });
    
        it('should unsubscribe correctly', () => {
            const callback = vi.fn();
            const unsubscribe = router.subscribe(callback);
      
            expect(callback).toHaveBeenCalled();

            // Reset the call count
            callback.mockReset();

            // Unsubscribe
            unsubscribe();
      
            // Trigger navigation event
            router.navigate('about');
      
            // Should not be called after unsubscribe
            expect(callback).not.toHaveBeenCalled();
        });
    });
  
    describe('replaceState', () => {
        it('should update state without navigation when only state is provided', () => {
            const updateSpy = vi.spyOn(router._navigation, 'updateCurrentEntry');
            const navigateSpy = vi.spyOn(router._navigation, 'navigate');
      
            router.replaceState({ state: { test: 'value', }, });
      
            expect(updateSpy).toHaveBeenCalledWith({ test: 'value', });
            expect(navigateSpy).not.toHaveBeenCalled();
        });
    
        it('should not navigate when hash is provided', () => {
            const navigateSpy = vi.spyOn(router._navigation, 'navigate');
      
            router.replaceState({ hash: 'about', });
      
            expect(navigateSpy).not.toHaveBeenCalled();
        });
    
        it('should update state and not navigate when both are provided', () => {
            const updateSpy = vi.spyOn(router._navigation, 'updateCurrentEntry');
            const updateEntrySpy = vi.spyOn(router._navigation, 'updateCurrentEntryHash');
            const navigateSpy = vi.spyOn(router._navigation, 'navigate');
      
            router.replaceState({ 
                state: { test: 'value', },
                hash : 'contact',
            });
      
            expect(updateEntrySpy).toHaveBeenCalledWith('contact', { test: 'value', });
            expect(navigateSpy).not.toHaveBeenCalled();
            expect(updateSpy).not.toHaveBeenCalled();
        });
    
        it('should do nothing when no config is provided', () => {
            const updateSpy = vi.spyOn(router._navigation, 'updateCurrentEntry');
            const navigateSpy = vi.spyOn(router._navigation, 'navigate');
      
            router.replaceState();
      
            expect(updateSpy).not.toHaveBeenCalled();
            expect(navigateSpy).not.toHaveBeenCalled();
        });
    });
  
    describe('goBack and goToPrev', () => {
        it('should both call navigation.back()', () => {
            const backSpy = vi.spyOn(router._navigation, 'back');
      
            router.goBack();
            expect(backSpy).toHaveBeenCalledTimes(1);
      
            router.goToPrev();
            expect(backSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('get params from url', () => {
        it('should get params with paramaters', () => {   
            router.create({
                onChange: () => {},
                config  : {
                    homeUrl   : 'home',
                    routeNames: [
                        'home', 
                        'profile/:id', 
                        'user/:name',
                        'item/:name/info/:id'
                    ],
                },
            });   
            router.navigate('profile/222');
            expect(router.currentEntry.value.getParams()).toEqual({id: '222',});
            router.navigate('user/john');
            expect(router.currentEntry.value.getParams()).toEqual({name: 'john',});
            router.navigate('item/metric/info/222');
            expect(router.currentEntry.value.getParams()).toEqual({
                "id"  : "222",
                "name": "metric",
            });
            router.navigate('home');
            expect(router.currentEntry.value.getParams()).toEqual({});
        });

        it('should get params with paramaters after go back', () => {   
            router.create({
                onChange: () => {},
                config  : {
                    homeUrl   : 'home',
                    routeNames: [
                        'home', 
                        'profile/:id' 
                    ],
                },
            });   
            router.navigate('profile/222');
            expect(router.currentEntry.value.getParams()).toEqual({id: '222',});
            router.navigate('home');
            router.goBack();
            expect(router.currentEntry.value.getParams()).toEqual({id: '222',});            
        });
    });

    describe('get query from url', () => {
        it('should get params with paramaters', () => {   
            router.create({
                onChange: () => {},
                config  : {
                    homeUrl   : 'home',
                    routeNames: [
                        'home', 
                        'profile'
                    ],
                },
            });   
            router.navigate('profile?param1=test1&param2=test2');
            expect(router.currentEntry.value.getQuery()).toEqual({ param1: 'test1', param2: 'test2', });
        });
    });
});

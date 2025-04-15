/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHashRouter } from '../core/hashRouter';
import { createHashNavigation } from '../core/hashNavigation';

describe('hashRouter', () => {
    let router: ReturnType<typeof createHashRouter>;
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
            console.log('%c url', 'background: #222; color: #bada55', url);
            
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
        
        // Create new instances for each test
        router = createHashRouter(createHashNavigation);
        onChange = vi.fn();
    });
  
    afterEach(() => {
        // Restore original methods
        window.history.pushState = originalHistoryPushState;
        window.history.replaceState = originalHistoryReplaceState;
        window.history.back = originalHistoryBack;
        window.history.forward = originalHistoryForward;
        window.history.go = originalHistoryGo;
        
        // Clear any event listeners
        router.navigation.destroy();
        vi.clearAllMocks();
    });
  
    describe('create', () => {
        it('should initialize the router with provided routes', () => {
            const unsubscribe = router.create({
                onChange,
                config: {
                    homeUrl   : 'home',
                    routeNames: ['home', 'about', 'contact'],
                },
            });
      
            expect(typeof unsubscribe).toBe('function');
            expect(onChange).toHaveBeenCalledTimes(1);
            
            expect(router.getHash()).toBe('home');
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
    });
  
    describe('navigate', () => {
        it('should navigate to specified hash', () => {
            const navigateSpy = vi.spyOn(router.navigation, 'navigate');
      
            router.navigate('about');
      
            expect(navigateSpy).toHaveBeenCalledWith('about', expect.objectContaining({
                state: undefined,
            }));
        });
    
        it('should navigate with state', () => {
            const state = { id: 123, name: 'test', };
            const navigateSpy = vi.spyOn(router.navigation, 'navigate');
      
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
                    getHash: expect.any(Function),
                }),
                expect.anything()
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
            const updateSpy = vi.spyOn(router.navigation, 'updateCurrentEntry');
            const navigateSpy = vi.spyOn(router.navigation, 'navigate');
      
            router.replaceState({ state: { test: 'value', }, });
      
            expect(updateSpy).toHaveBeenCalledWith({ test: 'value', });
            expect(navigateSpy).not.toHaveBeenCalled();
        });
    
        it('should navigate when hash is provided', () => {
            const navigateSpy = vi.spyOn(router.navigation, 'navigate');
      
            router.replaceState({ hash: 'about', });
      
            expect(navigateSpy).toHaveBeenCalledWith('about', expect.anything());
        });
    
        it('should update state and navigate when both are provided', () => {
            const updateSpy = vi.spyOn(router.navigation, 'updateCurrentEntry');
            const navigateSpy = vi.spyOn(router.navigation, 'navigate');
      
            router.replaceState({ 
                state: { test: 'value', },
                hash : 'contact',
            });
      
            expect(updateSpy).toHaveBeenCalledWith({ test: 'value', });
            expect(navigateSpy).toHaveBeenCalledWith('contact', expect.anything());
        });
    
        it('should do nothing when no config is provided', () => {
            const updateSpy = vi.spyOn(router.navigation, 'updateCurrentEntry');
            const navigateSpy = vi.spyOn(router.navigation, 'navigate');
      
            router.replaceState();
      
            expect(updateSpy).not.toHaveBeenCalled();
            expect(navigateSpy).not.toHaveBeenCalled();
        });
    });
  
    describe('goBack and goToPrev', () => {
        it('should both call navigation.back()', () => {
            const backSpy = vi.spyOn(router.navigation, 'back');
      
            router.goBack();
            expect(backSpy).toHaveBeenCalledTimes(1);
      
            router.goToPrev();
            expect(backSpy).toHaveBeenCalledTimes(2);
        });
    });
});

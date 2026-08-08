import { describe, expect, it } from 'vitest';

import { createHashNavigation } from '../core/hashNavigation';

describe('hashNavigation/navigate', () => {
    it('should not create a duplicate entry for the same hash expressed differently', () => {
        const nav = createHashNavigation();
        const initialCount = nav.entries.value.length;

        nav.navigate('/users/ivan%20petrov');
        expect(nav.entries.value.length).toBe(initialCount + 1);

        nav.navigate('/users/ivan petrov');
        expect(nav.entries.value.length).toBe(initialCount + 1);

        nav.navigate('users/ivan petrov');
        expect(nav.entries.value.length).toBe(initialCount + 1);

        nav.navigate('/users/ivan%20petrov/');
        expect(nav.entries.value.length).toBe(initialCount + 1);
    });

    it('should push a new entry when the hash actually changes', () => {
        const nav = createHashNavigation();
        const initialCount = nav.entries.value.length;

        nav.navigate('/about');
        expect(nav.entries.value.length).toBe(initialCount + 1);

        nav.navigate('/users/42');
        expect(nav.entries.value.length).toBe(initialCount + 2);
    });

    it('should update state without pushing a new entry for an unchanged hash', () => {
        const nav = createHashNavigation();

        nav.navigate('/about', { state: { tab: 'profile', }, });
        const count = nav.entries.value.length;

        nav.navigate('/about', { state: { tab: 'settings', }, });

        expect(nav.entries.value.length).toBe(count);
        expect(nav.currentEntry.value.state).toEqual({ tab: 'settings', });
    });

    it('should keep the current URL when navigating to the same hash with new state', () => {
        const nav = createHashNavigation();

        nav.navigate('/settings');
        const url = nav.currentEntry.value.url;

        nav.navigate('/settings/', { state: { theme: 'dark', }, });

        expect(nav.currentEntry.value.url).toBe(url);
        expect(nav.currentEntry.value.state).toEqual({ theme: 'dark', });
    });
});

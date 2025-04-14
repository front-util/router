import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        globals    : true,
        include    : ['src/**/*.{test,spec}.{js,ts}'],
        coverage   : {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude : ['**/node_modules/**', '**/dist/**', '**/types/**'],
        },
    },
    resolve: {
        alias: {
            '#src': path.resolve(__dirname, './src'),
        },
    },
});

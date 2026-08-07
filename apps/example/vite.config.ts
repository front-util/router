import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react()
    ],
    resolve: {
        alias: {
            '@front-utils/router': fileURLToPath(new URL('../../packages/router/src/index.ts', import.meta.url)),
        },
    },
    // Configure server options
    server: {
        port      : 4000,
        open      : false,
        strictPort: true,
    },
});

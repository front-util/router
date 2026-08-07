import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        react()
    ],
    resolve: {
        alias: {
            '@front-utils/router'        : fileURLToPath(new URL('../../packages/router/src/index.ts', import.meta.url)),
            '@front-utils/e2e-mini-app-1': fileURLToPath(new URL('../../packages/mini-app-1/src/index.tsx', import.meta.url)),
            '@front-utils/e2e-mini-app-2': fileURLToPath(new URL('../../packages/mini-app-2/src/index.tsx', import.meta.url)),
        },
    },
    server: {
        port      : 5001,
        open      : false,
        strictPort: true,
    },
});

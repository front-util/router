import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react()
    ],
    // Configure server options
    server: {
        port      : 4000,
        open      : false,
        strictPort: true,
    },
});
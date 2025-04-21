import { utils } from '@front-utils/linter';

export default utils.createEslintConfig({
    types: ['ts', 'react'],
    files: ['src/**/*.{ts,tsx,js}', 'vitest.config.ts'],
});


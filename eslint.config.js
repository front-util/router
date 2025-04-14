import { utils } from '@front-utils/linter';

export default utils.createEslintConfig({
    types: ['ts'],
    files: ['src/**/*.{ts,tsx,js}', 'vitest.config.ts'],
});


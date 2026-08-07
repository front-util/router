import { configs } from '@front-utils/linter';
import { defineConfig } from 'eslint/config';

const sourceFiles = ['src/**/*.{ts,tsx}'];

export default defineConfig([
    defineConfig({
        extends: configs.react,
        files  : sourceFiles,
    }),
    {
        files: ['src/**/*.tsx'],
        rules: {
            'check-file/filename-naming-convention': ['error', {
                '**/*.tsx': 'PASCAL_CASE',
            }],
        },
    },
    {
        files: ['src/index.tsx'],
        rules: {
            'check-file/filename-naming-convention': 'off',
        },
    },
]);

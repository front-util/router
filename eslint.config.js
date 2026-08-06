import { configs } from '@front-utils/linter';
import { defineConfig } from 'eslint/config';

const sourceFiles = ['src/**/*.{ts,tsx,js}', 'vitest.config.ts'];

export default defineConfig([
    defineConfig({
        extends: configs.react,
        files  : sourceFiles,
    }),
    {
        files: sourceFiles,
        rules: {
            // The router compares URL hashes — not cryptographic secrets
            'security/detect-possible-timing-attacks': 'off',
        },
    },
    {
        files: ['src/**/*.tsx'],
        rules: {
            // React component files are PascalCase
            'check-file/filename-naming-convention': ['error', {
                '**/*.tsx': 'PASCAL_CASE',
            }],
        },
    },
    {
        files: ['src/**/*.test.{ts,tsx}'],
        rules: {
            // Tests intentionally use `any` for browser API mocks
            '@typescript-eslint/no-unsafe-assignment'   : 'off',
            '@typescript-eslint/no-unsafe-call'         : 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-argument'     : 'off',
            '@typescript-eslint/no-unsafe-return'       : 'off',
            '@typescript-eslint/unbound-method'         : 'off',
            'sonarjs/prefer-specific-assertions'        : 'off',
            'sonarjs/super-linear-regex'                : 'off',
            'unicorn/no-non-function-verb-prefix'       : 'off',
            'unicorn/prefer-location-assign'            : 'off',
        },
    },
]);

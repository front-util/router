import { configs } from '@front-utils/linter';
import { defineConfig } from 'eslint/config';

const sourceFiles = ['src/**/*.{ts,tsx}', 'e2e/**/*.{ts,tsx}', 'vite.config.ts', 'playwright.config.ts'];

export default defineConfig([
    defineConfig({
        extends: configs.react,
        files  : sourceFiles,
    }),
    {
        files: sourceFiles,
        rules: {
            'security/detect-possible-timing-attacks'   : 'off',
            'react-x/set-state-in-effect'               : 'off',
            'compat/compat'                             : 'off',
        },
    },
    {
        files: ['src/**/*.tsx'],
        rules: {
            'check-file/filename-naming-convention': ['error', {
                '**/*.tsx': 'PASCAL_CASE',
            }],
        },
    },
    {
        files: ['src/main.tsx'],
        rules: {
            'check-file/filename-naming-convention'          : 'off',
            'unicorn/no-global-object-property-assignment'   : 'off',
        },
    },
    {
        files: ['e2e/**/*.spec.ts'],
        rules: {
            '@typescript-eslint/no-unsafe-assignment'   : 'off',
            '@typescript-eslint/no-unsafe-call'         : 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-argument'     : 'off',
            '@typescript-eslint/no-unsafe-return'       : 'off',
            '@typescript-eslint/unbound-method'         : 'off',
            'check-file/filename-naming-convention'     : 'off',
            'sonarjs/prefer-specific-assertions'        : 'off',
            'sonarjs/super-linear-regex'                : 'off',
            'unicorn/no-non-function-verb-prefix'       : 'off',
            'unicorn/prefer-location-assign'            : 'off',
            'security/detect-non-literal-regexp'        : 'off',
        },
    },
]);

import { configs } from '@front-utils/linter';
import { defineConfig } from 'eslint/config';

const sourceFiles = ['**/*.{ts,tsx}', 'vite.config.ts'];

export default defineConfig([
    defineConfig({
        extends: configs.react,
        files  : sourceFiles,
    }),
    {
        files: sourceFiles,
        rules: {
            'security/detect-possible-timing-attacks': 'off',
            'compat/compat'                          : 'off',
            'react-x/no-context-provider'            : 'off',
            'react-x/no-use-context'                 : 'off',
        },
    },
    {
        files: ['**/*.tsx'],
        rules: {
            'check-file/filename-naming-convention': ['error', {
                '**/*.tsx': 'PASCAL_CASE',
            }],
        },
    },
    {
        files: ['index.tsx'],
        rules: {
            'check-file/filename-naming-convention': 'off',
        },
    },
]);

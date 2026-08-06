import { utils } from '@front-utils/linter';

// @front-utils/linter sets both `project` and `projectService` in parserOptions;
// typescript-eslint >=8.47 rejects that combination. projectService supersedes
// `project`, so drop it for the ts configs.
const stripRedundantProject = (type, config) => {
    if(type !== 'ts') {
        return config;
    }

    const parserOptions = config.languageOptions?.parserOptions;

    if(parserOptions?.projectService && parserOptions.project) {
        return {
            ...config,
            languageOptions: {
                ...config.languageOptions,
                parserOptions: {
                    ...parserOptions,
                    project: undefined,
                },
            },
        };
    }

    return config;
};

export default utils.createEslintConfig({
    types: ['ts', 'react'],
    files: ['src/**/*.{ts,tsx,js}', 'vitest.config.ts'],
    typesAdapter: stripRedundantProject,
});


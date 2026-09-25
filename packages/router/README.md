# @front-utils/router

Client-side hash router for the browser, built on `@preact/signals`. Provides a low-level `HashNavigation` wrapper over the History API, a `HashRouter` routing layer, and a React `ClientRouter` component.

## Documentation

The full public API reference and usage examples live in the repository root [README](https://github.com/front-util/router/blob/main/README.md).

## Install

```bash
npm install @front-utils/router
```

## Development (monorepo)

The repository is a Turborepo monorepo. All commands run from the repository root and use **npm** (not yarn/bun).

- `npm run check-lint` — ESLint across all workspaces
- `npm run check-types` — `tsc --noEmit` across all workspaces
- `npm test` — Vitest unit tests for this package
- `npm run test:e2e` — Playwright e2e suite (auto-starts Vite on port 5001)
- `npm run validate` — required gate before any commit: `check-lint` + `check-types` + `test`

## Publishing

- `npm run pub` — build + `npm publish` (manual publish from `main`)
- A GitHub release triggers the CI publish workflow (`.github/workflows/npm-publish.yaml`), which publishes with `--provenance` using the `NPM_TOKEN` secret.
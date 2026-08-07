---
description: Запуск тестов и покрытие
---

Этот воркфлоу описывает работу с тестами в проекте.

## Unit-тесты (Vitest, пакет `packages/router`)

1. Запусти unit-тесты разово:
```bash
npm run test
```

2. Запусти тесты в режиме наблюдения во время разработки:
```bash
npm run test:watch
```

3. Проверь покрытие тестами:
```bash
npm run test:coverage
```

4. Все новые функции ДОЛЖНЫ покрываться unit-тестами в `packages/router/src/__tests__/` (или colocated `*.test.ts`).
5. При изменении логики в `packages/router/src/core/`, обязательно запусти все тесты, так как это ядро системы.

## E2E-тесты (Playwright, `apps/e2e`)

6. Запусти e2e-спекы (автозапуск Vite dev-сервера на порту 5001):
```bash
npm run test:e2e
```

7. Для UI-режима Playwright:
```bash
npm run test:e2e:ui
```

8. Спеки лежат в `apps/e2e/e2e/*.spec.ts`, общие хелперы — в `apps/e2e/e2e/utils.ts` (хелперы `readDebug`, `expectRoute`, `collectConsoleErrors`, `expectNoConsoleErrors`).

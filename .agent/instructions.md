# Инструкции для AI-агента в проекте @front-utils/router

Этот проект представляет собой легковесный hash-роутер на основе сигналов (@preact/signals).

## Стек технологий
- **Runtime**: Node.js (npm), turborepo monorepo
- **Язык**: TypeScript (строгая типизация)
- **Сборка**: Rspack, tsc (для типов)
- **Тестирование**: Vitest (unit, пакет `packages/router`) + Playwright (e2e, `apps/e2e`)
- **Управление состоянием**: @preact/signals

## Основные правила
1. **Типизация**: Всегда используй строгую типизацию. Избегай `any`. Экспортируй интерфейсы из `packages/router/src/types.ts`.
2. **Производительность**: Роутер должен быть максимально быстрым. Минимизируй количество подписок и перерисовок.
3. **Валидация**: Перед завершением задачи ОБЯЗАТЕЛЬНО запусти `npm run validate` (lint + types + unit-тесты). Для e2e отдельно — `npm run test:e2e`.
4. **Стиль кода**: Следуй правилам ESLint. Используй функциональный стиль.

## Структура проекта
- `packages/router/src/core/`: Ядро роутера (`hashNavigation.ts`, `hashRouter.ts`).
- `packages/router/src/react/`: Bindings для React (`ClientRouter.tsx`).
- `packages/router/src/helpers.ts`: Вспомогательные функции.
- `packages/router/src/types.ts`: Общие типы и интерфейсы.
- `packages/mini-app-1/`, `packages/mini-app-2/`: Фикстуры (мини-приложения) для e2e.
- `apps/e2e/`: e2e-хост (react-router v6, порт 5001) + Playwright-спеки в `apps/e2e/e2e/`.
- `apps/example/`: Отдельное Vite-приложение с примерами (не импортировать из пакета роутера).

## Команды (из корня репозитория)
- `npm run check-lint`: Проверка линтером (turbo, 5 воркспейсов, `--fix`).
- `npm run check-types`: Проверка типов (turbo).
- `npm run test`: Unit-тесты Vitest (только `packages/router`).
- `npm run test:e2e`: Playwright-спеки из `apps/e2e` (автозапуск Vite на 5001).
- `npm run validate`: Полная проверка проекта (lint + types + unit-тесты).
- `npm run build`: Сборка (turbo).

## Работа с багами
Используй воркфлоу `/fix-bug`. Баги взаимодействия с хостом/роутингом сначала воспроизводи failing e2e-спекой в `apps/e2e/e2e/`; чистые баги строк/роутов — в `packages/router/src/__tests__/helpers.test.ts`. Unit-тесты требуют моков браузера (`window.location`, `window.history`), так как проект сильно зависит от окружения DOM.

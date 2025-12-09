# AGENTS.md

## Project

AAC Board AI — React 19 + TypeScript AAC board with Chrome Built-in AI. MUI, Vite, Vitest. Accessibility-critical.

## Dev

- Install: `npm install`
- Dev: `npm run dev`
- Tests: `npm test`
- Lint: `npm run lint`
- Aliases: `@app`, `@features`, `@shared`, `@pages`

## Structure

- `app` — shell, providers, layout, dialogs
- `features/board` — AAC board logic (components/hooks/DB/state)
- `pages` — route components
- `shared` — reusable UI + utils + AI hooks

## Testing

- MUST update/add tests when behavior/UI changes.
- MUST run tests before final output (`npm test`).

## Agent Rules

- Small scoped changes; ask before large refactors.
- Maintain folder boundaries.

## Style

- TypeScript + React 19, functional components.
- React Compiler enabled → **avoid `useMemo`/`useCallback`**.
- Accessibility required (keyboard use preserved).

## Responses

- State assumptions when modifying design.

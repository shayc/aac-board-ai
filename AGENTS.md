# AGENTS.md

## Project

AAC Board AI — React 19 + TypeScript AAC board with Chrome Built-in AI.  
Vite, MUI, Vitest. Accessibility-critical.

## Dev

- Install: `npm install`
- Dev server: `npm run dev`
- Test suite: `npm test`
- Lint: `npm run lint`
- Path aliases: `@app`, `@features`, `@shared`, `@pages`

## Structure

- `app` — shell, providers, layout, dialogs
- `features/board` — AAC board logic (components/hooks/DB/state)
- `pages` — route components
- `shared` — reusable UI, utilities, Chrome AI helpers

## Testing

- When behavior or UI changes, **add/update tests** next to the code you touched.
- Before final output, run: `npm test`.

## Code Style

- React Compiler is enabled → **avoid `useMemo` / `useCallback` unless strictly required**.

## Git / Workflow

- Keep changes **small and focused** (one logical change per PR).

## Boundaries for Agents

- ✅ **Always do**
  - Use the existing folder structure (`app`, `features`, `pages`, `shared`).
- ⚠️ **Ask first**
  - Adding new libraries, changing build config, or modifying test setup.
- 🚫 **Never do**
  - Remove or weaken accessibility features just to simplify code.

## Responses

- When you change behavior or design, **state your assumptions**.
- Summarize:
  - Files changed.
  - Any follow-up work you recommend.

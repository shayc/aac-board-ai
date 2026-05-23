# AGENTS.md

## Project Overview

- Client-side AAC (communication board) web app.
- Stack: React 19 + TypeScript + Vite; MUI; React Router.
- Built-in AI is progressive enhancement; core app must work when AI APIs are unavailable.

## Commands

- Install (CI): `npm ci`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Format: `npm run format`
- Test: `npm test`
- Coverage: `npm run coverage`
- Build (includes typecheck): `npm run build`
- Playwright browsers (required for `npm test` / CI): `npx playwright install --with-deps`

## Project Structure

- `src/main.tsx`: React entry
- `src/app/`: app shell + providers
- `src/features/`: feature modules
- `src/pages/`: routes/pages
- `src/shared/`: shared code

## Testing Instructions

- Structure: Colocate tests as `*.test.ts(x)`.
- Runner: `npm test` runs Vitest browser mode via Playwright (real Chromium).
- Utilities: Use `vitest-browser-react` for components and interactions.
- Determinism: No sleeps; prefer real timers — use `vi.useFakeTimers()` only when advancing time deterministically.
- Mocking: Render the full tree. Do not mock internals (child components, hooks, contexts, providers, utilities) or native web APIs.
  - **Allowed stubs (closed list):** network (e.g., `fetch`, WebSocket), non-determinism (e.g., `Date.now`, `Math.random`), device output (e.g., `speechSynthesis`, `HTMLAudioElement.play`).
  - **Method:** Prefer `vi.spyOn` over `vi.mock`.
- Scope:
  - **Interactive:** Prove a behavior (interaction → observable result).
  - **Presentational:** Render-only assertions for accessibility, content, and visibility.

## Code Style Guidelines

- TypeScript: Maintain strict type accuracy; avoid `any` unless unavoidable.
- Linting: Fix underlying issues explicitly; do not use `eslint-disable` comments.
- Imports: Prefer path aliases (`@app/*`, `@features/*`, `@shared/*`, `@pages/*`).
- MUI: Import subpaths (e.g., `@mui/material/Button`) over package root to minimize bundle size.
- React Compiler: Enabled by default; avoid `useMemo`/`useCallback` micro-optimizations.
- Syntax: Use braces for `if` statements, even when the body is a single statement.
- Logic: Prefer early returns over nested or chained ternary operators; extract complex JSX conditions into sub-components.
- Comments: Prioritize self-documenting code; use inline comments only to explain "why", not "what".
- Naming: Use meaningful variable names; avoid ambiguous abbreviations.

## Workflow (Git/PR)

- CI (Node 24): `npm ci` → Playwright install → lint → test → build.
- Pre-commit: `lint-staged` runs ESLint `--fix` + Prettier on staged files.

## Boundaries (Safety Rules)

### Always

- Keep changes scoped; avoid broad refactors or sweeping reformatting.
- Verify changes: Run `npm run lint`, `npm test`, and `npm run build` before committing.
- Consistency: Follow existing module boundaries and nearby-file patterns.

### Ask First

- Dependency updates (`package.json`, `package-lock.json`).
- Infrastructure changes (CI, build tooling, lint/test config).
- Data format modifications (OBF/OBZ import/export compatibility).
- Architecture changes (Large UI rewrites, routing overhaul, cross-cutting refactors).

### Never

- Commit secrets, tokens, or API keys.
- Suppress linting, typechecking, or tests to force a passing build.
- Manually edit generated output (`dist/`, `coverage/`).
- Add telemetry, analytics, or data exfiltration without explicit approval.

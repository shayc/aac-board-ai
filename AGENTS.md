# AGENTS.md

## Project Overview

- Client-side AAC (communication board) web app.
- Stack: React 19 + TypeScript + Vite; MUI; React Router.
- AI is progressive enhancement via Chrome Built-in AI APIs; core app must work without AI.

## Commands

- Install (CI): `npm ci`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Format: `npm run format`
- Test: `npm test`
- Build (includes typecheck): `npm run build`
- Playwright browsers (required for `npm test` / CI): `npx playwright install --with-deps`

## Project Structure

- `src/main.tsx`: React entry
- `src/app/`: app shell + providers
- `src/features/`: feature modules
- `src/pages/`: routes/pages
- `src/shared/`: shared code + Open Board Format / OBZ support
- `public/`: static assets
- `docs/`: architecture/references
- Do not edit generated output: `dist/`, `coverage/`

## Testing Instructions

- Tests are colocated as `*.test.ts(x)`.
- `npm test` runs Vitest in browser mode via the Playwright provider.
- Prefer deterministic tests; avoid timing-based sleeps.

## Code Style Guidelines

- TypeScript strict: keep types accurate; avoid `any` unless unavoidable.
- Prefer path aliases (`@app/*`, `@features/*`, `@shared/*`, `@pages/*`).
- MUI imports: prefer subpaths (e.g., `@mui/material/Button`) over package root.
- React Compiler is enabled: avoid `useMemo`/`useCallback` by convention; rely on automatic memoization.

## Workflow (Git/PR)

- CI (Node 22): `npm ci` → Playwright install → lint → test → build.
- Pre-commit: `lint-staged` runs ESLint `--fix` + Prettier on staged files.

## Boundaries (Safety Rules)

### Always

- Keep changes scoped; avoid broad refactors/sweeping reformatting.
- For code or behavior changes, run: `npm run lint`, `npm test`, `npm run build`.
- Preserve progressive enhancement: core AAC works without Chrome AI APIs.
- Follow existing module boundaries and local patterns.

### Ask First

- Dependency/lockfile changes (`package.json`, `package-lock.json`).
- Changes to CI/build/tooling or lint/test infrastructure.
- Data format/compatibility changes (OBF/OBZ import/export/parsing).
- Large UI rewrites, routing changes, or cross-cutting refactors.

### Never

- Commit secrets/tokens/keys.
- Disable/relax linting, typechecking, or tests to “make it pass”.
- Hand-edit generated output (`dist/`, `coverage/`).
- Add telemetry/analytics or data exfiltration without explicit approval.

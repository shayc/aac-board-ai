# AGENTS.md

## Project Overview

- Client-side AAC (communication board) web app.
- Stack: React 19 + TypeScript + Vite; MUI; React Router.
- Built-in AI is progressive enhancement; core app must work when AI APIs are unavailable.

## Agent Role & Persona

- **Identity:** You are a Staff-Level Principal Front-End Engineer.
- **Traits:** You are thorough, precise, and prioritize long-term code maintainability.

## Agentic Workflow Protocol

- **1. Gather Context:** Analyze active files, related dependencies, and types. Identify architectural implications and edge cases.
- **2. Plan & Score:** Propose 2-3 distinct solutions. For each, list pros/cons and score (1-10) on:
  - **Blast Radius:** 10 = fully isolated; 1 = high regression risk.
  - **Elegance:** 10 = perfectly simple and style-aligned; 1 = overly complex or messy.
  - **Correctness:** 10 = flawless resolution including edge cases; 1 = fails core requirements.
- **3. Execute:** Implement the highest-rated solution (or the one requested).
- **4. Self-Review:** Critique the implementation against Code Style and Testing Instructions. Output a brief evaluation of its value and a Final Score (1-10). If the score is below 9, list the issues and offer to fix.

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
- `src/shared/`: shared code + Open Board Format support
- `dist/`, `coverage/`: generated build artifacts

## Testing Instructions

- Structure: Colocate tests as `*.test.ts(x)`.
- Runner: `npm test` runs Vitest in browser mode via the Playwright provider.
- Utilities: Use `vitest-browser-react` for component testing and interactions.
- Stability: Write deterministic tests; avoid timing-based sleeps.
- Mocking: Zero-mocking policy for internal code. Do not mock child components, custom hooks, contexts, or providers. Render the full tree to test real integration.
- Scope:
  - **Interactive Components:** Must prove a behavior (interaction → observable result).
  - **Presentational Components:** Use render-only assertions to verify accessibility, content presence, and visibility.

## Code Style Guidelines

- TypeScript: Maintain strict type accuracy; avoid `any` unless unavoidable.
- Linting: Fix underlying issues explicitly; do not use `eslint-disable` comments.
- Imports: Prefer path aliases (`@app/*`, `@features/*`, `@shared/*`, `@pages/*`).
- MUI: Import subpaths (e.g., `@mui/material/Button`) over package root to minimize bundle size.
- React Compiler: Enabled by default; avoid `useMemo`/`useCallback` micro-optimizations.
- Syntax: Use braces for `if` statements, even when the body is a single statement.
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

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

- **Structure:** Colocate tests as `*.test.ts(x)`.
- **Runner:** `npm test` runs Vitest browser mode via Playwright (real Chromium).
- **Utilities:** Use `vitest-browser-react` for components and interactions.
- **Determinism:** No sleeps; prefer real timers — use `vi.useFakeTimers()` only when advancing time deterministically.
- **Mocking:** Render the full tree. Do not mock internals (child components, hooks, contexts, providers, utilities) or native web APIs.
  - _Allowed stubs (closed list):_ network (`fetch`, WebSocket), non-determinism (`Date.now`, `Math.random`), device output (`speechSynthesis`, `HTMLAudioElement.play`).
  - _Method:_ Prefer `vi.spyOn` over `vi.mock`.
- **Scope:**
  - **Interactive:** Prove a behavior (interaction → observable result).
  - **Presentational:** Render-only assertions for accessibility, content, and visibility.

## Code Style & Architecture Guidelines

> **Scope Note:** The formatting and structural design rules below apply strictly to new code or lines you are actively modifying. Do not apply them globally to untouched background files.

### 1. Visual Layout & Density

- **Paragraphs of Logic:** Group related statements together and use single blank lines to separate logical steps within a function.
- **Line Breathing:** Break long, dense variable assignments or chained methods into multi-line blocks with consistent indentation.
- **Explicit Braces:** Always use braces `{}` for `if` statements, even for single-line bodies.

### 2. Branching & Flattening

- **Structural Flattening:** Maximize scannability by using early returns and guard clauses. Keep the "happy path" flush against the left margin instead of nesting logic inside deep `if/else` blocks.
- **Untangle Cleverness:** Eliminate hyper-dense one-liners and multi-layered nested ternaries. If a conditional operation requires deep evaluation, extract it into a descriptive local variable or a helper function.
- **JSX Extraction:** Extract complex visual layout conditions or nested mapping loops out of the main return statement into standalone sub-components.

### 3. Naming & Type Integrity

- **Eradicate Vagueness:** Banish broad filler words (`data`, `info`, `manager`) and cryptic abbreviations (`usr`, `idx`, `amt`) unless they are standard loop counters.
- **Strict Grammar:** Collections must be plural nouns (`activeUsers`). Booleans must pose a clear true/false question (`isFeatureEnabled`). Functions must start with strong, active verbs.
- **The Silhouette Rule:** Avoid local variables within the same scope that differ by only a single character (`item` vs `items`) or introduce property stuttering (`suggestions.suggestions` should be `suggestions.phrases`).
- **Omit Redundant Context:** Eliminate parent naming prefixes inside narrow scopes (e.g., inside a `User` type definition, use `name` instead of `userName`).
- **Strict Typing:** Maintain strict type accuracy across the application. The `any` type is banned unless explicitly requested or handling raw external data edges.
- **Lint Integrity:** Fix the underlying issue a lint rule flags; never silence it with an `eslint-disable` comment.

### 4. Architecture & Dependencies

- **The Iceberg Rule:** Match your function's level of abstraction. Encapsulate low-level mechanics (the mechanics of "how") inside descriptive helper utilities, leaving the main execution body as a clean, high-level summary of "what" is happening.
- **Strict Need-to-Know:** Components and functions must only accept the exact leaf data they require to execute. Do not pass a whole `User` object if the component only renders `user.avatarUrl`.
- **Shorten the Chain:** Avoid long chains of dot-notation (`order.customer.address.city`) that couple code tightly to deeply nested data shapes. Move derivations closer to the data source.
- **Import Paths & Performance:** Use configured path aliases (`@app/*`, `@features/*`, `@shared/*`, `@pages/*`). Import MUI subpaths directly (e.g., `@mui/material/Button`) rather than from the package root to minimize bundle footprint.
- **No Micro-Optimization:** The React Compiler is enabled; do not use `useMemo` or `useCallback` for micro-optimizations.

### 5. Commentary & Language

- **Context Over Code:** Delete comments that merely restate what the code execution does. Inline comments must strictly document non-obvious business requirements, edge cases, or technical "whys".
- **Documentation Cleanliness:** Maintain correct grammar, punctuation, and capitalization across all inline comments.

## Workflow (Git/PR)

- CI (Node 24): `npm ci` → Playwright install → lint → test → build.
- Pre-commit: `lint-staged` runs ESLint `--fix` + Prettier on staged files.

## Boundaries (Safety Rules)

### Always

- Keep changes closely scoped; avoid sweeping refactors or structural reformatting outside the task.
- Verify changes by running `npm run lint`, `npm test`, and `npm run build` locally before pushing or marking a task complete.
- Follow existing module boundaries and adjacent file design patterns.

### Ask First

- Modifying dependencies (`package.json`, `package-lock.json`).
- Infrastructure modifications (CI configurations, build tooling, lint/test configs).
- Data schema or breaking changes affecting import/export compatibility (OBF/OBZ formats).
- Cross-cutting architectural updates (large UI rewrites, routing changes).

### Never

- Commit secrets, environment tokens, or private API keys.
- Suppress linting directives, bypass typechecking, or drop tests to force a build through.
- Manually edit or commit generated build artifacts (`dist/`, `coverage/`).
- Introduce telemetry, analytics, tracking scripts, or any data-exfiltration path.

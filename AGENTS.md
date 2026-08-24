# AGENTS.md

## Project Overview

- Client-side AAC (communication board) web app.
- Stack: React 19 + TypeScript + Vite; MUI; React Router.
- Built-in AI is progressive enhancement; core app must work when AI APIs are unavailable.
- Accessibility is the top quality goal (AAC users depend on it), then offline reliability and privacy.

## Commands

- Install (CI): `npm ci`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Format: `npm run format`
- Check formatting: `npm run format:check`
- Test: `npm test`
- Test with coverage: `npm run test:coverage`
- Test one file: `npm test -- <file-or-pattern>`
- Lint specific files: `npm run lint -- <files>`
- Build (includes typecheck): `npm run build`
- Playwright browsers (required for `npm test` / CI): `npx playwright install --with-deps`
- CI (Node 24) runs install → Playwright install → format check → lint → test:coverage → build (CI enforces coverage floors; `npm test` runs the same suite without them).
- Pre-commit: `lint-staged` runs Oxlint `--fix` + Oxfmt on staged files.

## Project Structure

- `src/main.tsx`: React entry
- `src/app/`: app shell + providers
- `src/features/`: feature modules
- `src/pages/`: routes/pages
- `src/shared/`: shared code
- See [docs/architecture.md](docs/architecture.md) for module boundaries, invariants, and the "why" behind the structure.

## Testing Instructions

- **Structure:** Colocate tests as `*.test.ts(x)`.
- **Runner:** `npm test` runs Vitest browser mode via Playwright (real Chromium).
- **Utilities:** Use `vitest-browser-react` for components and interactions.
- **Determinism:** No sleeps; prefer real timers — use `vi.useFakeTimers()` only when advancing time deterministically.
- **Mocking:** Render the full tree. Do not mock internals (child components, hooks, contexts, providers, utilities). Use Chromium's real web APIs except for the allowed stubs below.
  - _Allowed stubs (closed list):_ network (`fetch`, WebSocket), non-determinism (`Date.now`, `Math.random`), device output (`speechSynthesis`, `HTMLAudioElement.play`), and browser capabilities unavailable in the test runtime (only at the platform boundary).
  - _Method:_ Prefer `vi.spyOn` over `vi.mock`.
- **Scope:**
  - **Interactive:** Prove a behavior (interaction → observable result).
  - **Presentational:** Render-only assertions for accessibility, content, and visibility.

## Code Style

Oxfmt and Oxlint own formatting and mechanical rules; the guidance below covers what tooling can't check. Apply it to code you write or touch, not to untouched files.

### Layout & Control Flow

- Group related statements into paragraphs separated by single blank lines.
- Use early returns and guard clauses; keep the happy path at the left margin.
- Extract dense conditionals and nested ternaries into named locals or helper functions.
- Extract complex conditional JSX and nested mapping loops into sub-components.

### Naming

- All files and folders under `src/` are kebab-case.
- Avoid vague filler words (`data`, `info`, `manager`) when a precise domain name is available, and avoid cryptic abbreviations (`usr`, `amt`) — standard loop counters excepted.
- Collections are plural nouns; booleans pose a true/false question (`isFeatureEnabled`); functions start with verbs; React components use descriptive PascalCase nouns.
- Don't keep variables in one scope that differ by a single character (`item` vs `items`), and rename property stuttering (`suggestions.suggestions` → `suggestions.phrases`).
- Drop redundant parent prefixes in narrow scopes (inside a `User` type: `name`, not `userName`).

### Abstraction & Data Flow

- Keep each function at one level of abstraction: low-level mechanics live in named helpers; the body reads as a summary of what happens.
- Prefer the smallest meaningful input a component or function needs; don't pass large objects solely to access one leaf property.
- Avoid long dot-chains (`order.customer.address.city`); derive values close to the data source.
- Use the path aliases (`@app/*`, `@features/*`, `@shared/*`, `@pages/*`, `@paraglide/*`).
- User-facing strings go through Paraglide: add keys to `messages/en.json` (and sibling locales); import `m` from `@paraglide/messages.js`. Never hardcode UI text.
- The React Compiler is enabled: write Compiler-native code; don't add `useMemo`/`useCallback` for performance.

### Comments

- Comments document non-obvious whys — business requirements, edge cases — never what the code does.

## Boundaries (Safety Rules)

### Always

- When starting new work without an existing task branch, create a branch from `main` using an intent-based prefix (`feat/`, `fix/`, `refactor/`). Never switch away from an existing task branch unless asked.
- Keep changes closely scoped; avoid sweeping refactors or structural reformatting outside the task.
- For code changes, verify with `npm run lint`, `npm test`, and `npm run build` before pushing or marking the task complete. For documentation-only changes, run only applicable formatting, link, or documentation checks.
- Follow existing module boundaries and adjacent file design patterns.

### Ask First

Ask first unless the requested task explicitly requires the change:

- Modifying dependencies (`package.json`, `package-lock.json`).
- Infrastructure modifications (CI configurations, build tooling, lint/test configs).
- Data schema or breaking changes affecting import/export compatibility (OBF/OBZ formats).
- Cross-cutting architectural updates (large UI rewrites, routing changes).

### Never

- Commit or push directly to the `main` branch.
- Commit secrets, environment tokens, or private API keys.
- Suppress linting directives, bypass typechecking, or drop tests to force a build through.
- Manually edit or commit generated artifacts (`dist/`, `coverage/`, `src/paraglide/`).
- Introduce telemetry, analytics, tracking, or undisclosed transmission of user content or usage data.

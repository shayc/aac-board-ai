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
- Test: `npm test`
- Test one file: `npm test -- <file-or-pattern>`
- Lint specific files: `npm run lint -- <files>`
- Build (includes typecheck): `npm run build`
- Playwright browsers (required for `npm test` / CI): `npx playwright install --with-deps`
- CI (Node 24) runs install → Playwright install → lint → test → build.
- Pre-commit: `lint-staged` runs ESLint `--fix` + Prettier on staged files.

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
- **Mocking:** Render the full tree. Do not mock internals (child components, hooks, contexts, providers, utilities) or native web APIs.
  - _Allowed stubs (closed list):_ network (`fetch`, WebSocket), non-determinism (`Date.now`, `Math.random`), device output (`speechSynthesis`, `HTMLAudioElement.play`).
  - _Method:_ Prefer `vi.spyOn` over `vi.mock`.
- **Scope:**
  - **Interactive:** Prove a behavior (interaction → observable result).
  - **Presentational:** Render-only assertions for accessibility, content, and visibility.

## Code Style

Prettier and ESLint own formatting and mechanical rules; the guidance below covers what tooling can't check. Apply it to code you write or touch, not to untouched files.

### Layout & Control Flow

- Group related statements into paragraphs separated by single blank lines.
- Use early returns and guard clauses; keep the happy path at the left margin.
- Extract dense conditionals and nested ternaries into named locals or helper functions.
- Extract complex conditional JSX and nested mapping loops into sub-components.

### Naming

- All files and folders under `src/` are kebab-case.
- No filler words (`data`, `info`, `manager`) or cryptic abbreviations (`usr`, `amt`) — standard loop counters excepted.
- Collections are plural nouns; booleans pose a true/false question (`isFeatureEnabled`); functions start with verbs.
- Don't keep variables in one scope that differ by a single character (`item` vs `items`), and rename property stuttering (`suggestions.suggestions` → `suggestions.phrases`).
- Drop redundant parent prefixes in narrow scopes (inside a `User` type: `name`, not `userName`).

### Abstraction & Data Flow

- Keep each function at one level of abstraction: low-level mechanics live in named helpers; the body reads as a summary of what happens.
- Pass components and functions only the leaf data they use — not a whole `User` for `user.avatarUrl`.
- Avoid long dot-chains (`order.customer.address.city`); derive values close to the data source.
- Use the path aliases (`@app/*`, `@features/*`, `@shared/*`, `@pages/*`, `@paraglide/*`).
- User-facing strings go through Paraglide: add keys to `messages/en.json` (and sibling locales); import `m` from `@paraglide/messages.js`. Never hardcode UI text.
- The React Compiler is enabled: write Compiler-native code; don't add `useMemo`/`useCallback` for performance.

### Comments

- Comments document non-obvious whys — business requirements, edge cases — never what the code does.

## Boundaries (Safety Rules)

### Always

- Keep changes closely scoped; avoid sweeping refactors or structural reformatting outside the task.
- Verify changes by running `npm run lint`, `npm test`, and `npm run build` before pushing or marking a task complete.
- Follow existing module boundaries and adjacent file design patterns.

### Ask First

- Modifying dependencies (`package.json`, `package-lock.json`).
- Infrastructure modifications (CI configurations, build tooling, lint/test configs).
- Data schema or breaking changes affecting import/export compatibility (OBF/OBZ formats).
- Cross-cutting architectural updates (large UI rewrites, routing changes).

### Never

- Commit secrets, environment tokens, or private API keys.
- Suppress linting directives, bypass typechecking, or drop tests to force a build through.
- Manually edit or commit generated artifacts (`dist/`, `coverage/`, `src/paraglide/`).
- Introduce telemetry, analytics, tracking scripts, or any data-exfiltration path.

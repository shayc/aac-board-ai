# AAC Board AI - Copilot Instructions

You are an expert AI coding assistant working on **AAC Board AI**, a React application that helps people with speech disabilities communicate using Chrome's Built-in AI.

## Project Overview

- **Type:** Client-side React 19 application (Vite 7).
- **Core Tech:** TypeScript 5.9, Material UI 7, React Router 7.
- **Key Feature:** Uses **Chrome Built-in AI (Gemini Nano)** for on-device, offline text processing (Proofreading, Rewriting, Translation).
- **Data:** Fully local using IndexedDB (`idb`) and Open Board Format (OBF/OBZ).
- **No Backend:** All processing happens in the browser.

## Architecture & Patterns

### Feature-Sliced Design

The codebase follows a feature-sliced structure. Respect these boundaries:

- `src/app/`: Global app shell, providers, and layout.
- `src/features/`: Self-contained features (e.g., `board`). Each feature has its own `components`, `context`, `hooks`, and `types`.
- `src/shared/`: Reusable utilities, UI components, and global contexts.
- `src/pages/`: Route components that compose features.

### Path Aliases

Always use configured path aliases for imports:

- `@app/*` → `src/app/*`
- `@features/*` → `src/features/*`
- `@shared/*` → `src/shared/*`
- `@pages/*` → `src/pages/*`

### React 19 & Compiler

- This project uses **React 19** and the **React Compiler**.
- **Do NOT** manually optimize with `useMemo` or `useCallback` unless specifically required for referential stability in external libraries. Trust the compiler.
- Use `use` hook for promise consumption if applicable (though standard `useEffect`/`async` patterns are still common here for AI streams).

### State Management

- Global state is managed via React Contexts composed in `src/app/AppProviders.tsx`.
- Feature-specific state resides in feature contexts (e.g., `BoardProvider`).
- **Do not** introduce Redux or other state libraries.

## AI Integration (Chrome Built-in AI)

AI features are implemented as custom hooks in `src/shared/hooks/ai/`.

- **Pattern:** Each AI API (Proofreader, Rewriter, etc.) has a dedicated hook (e.g., `useProofreader`).
- **Usage:** Hooks expose `isSupported`, `isReady`, `downloadProgress`, and a factory function (e.g., `createProofreader`).
- **Lifecycle:** AI sessions are expensive. Create them once and reuse them where possible, or let the hook manage the instance ref.
- **Fallbacks:** Always handle cases where AI is unavailable (`!isSupported`). The app must remain functional offline without AI.

## Data & Storage

- **IndexedDB:** Used for storing boards and assets. Use the `idb` library.
- **Open Board Format (OBF):** The data model is based on OBF.
  - Validation: Use `zod` schemas in `src/shared/open-board-format/schema.ts`.
  - Parsing: Use `src/shared/open-board-format/obf.ts`.
  - **Do not** modify the OBF schema without verifying compliance with the Open Board Format spec.

## Styling (Material UI 7)

- Use **MUI 7** components.
- Use the `sx` prop for one-off styles.
- Use `styled()` from `@mui/material/styles` for reusable styled components.
- Theme customization is in `src/shared/contexts/ThemeProvider`.

## Testing

- **Unit/Integration:** `vitest`
- **E2E:** `playwright` (via Vitest browser mode)
- Run tests with `npm test`.
- Write tests for new logic, especially AI hooks and OBF parsing.

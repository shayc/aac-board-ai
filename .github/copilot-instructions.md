# AAC Board AI – Copilot Instructions

## Core Principles

1. **Feature-Sliced Design** – Organize by feature, not layer
2. **Path Aliases Only** – Never use relative imports (`../../shared/`)
3. **Progressive Enhancement** – Always check `isXxxSupported` before using Chrome AI
4. **Type Safety** – Strict TypeScript, `import type` for types, prefer `interface`
5. **React Compiler** – React Compiler auto-memoizes; avoid manual `useMemo` / `useCallback`

---

## Project Overview

AAC Board AI is a **React 19 + TypeScript 5.9 + Vite 7** Progressive Web App that helps people with speech disabilities communicate using **Chrome's Built-in AI (Gemini Nano)**.  
It uses pictogram boards with AI-enhanced message composition—processed locally for privacy and offline use.

**Key Features:** Grammar correction, tone adjustment, and multi-language translation via Chrome's Proofreader, Rewriter, and Translator APIs.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, MUI 7, React Router 7, IndexedDB (idb), Vitest 4, Zod 4

---

## Architecture

### Feature-Sliced Structure

- `src/features/board/` – Board feature (components, hooks, db, context, mappers, types)
- `src/shared/` – Utilities, contexts, hooks (including `hooks/ai/`)
- `src/app/` – App shell and layout
- `src/pages/` – Route components

### Path Aliases

Configured in `tsconfig.app.json` and `vite.config.ts`:

```ts
import { HomePage } from "@pages/HomePage";
import { useBoard } from "@features/board/context/useBoard";
import { useTranslator } from "@shared/hooks/ai/useTranslator";
```

### Context Pattern

Each context has three files:  
`XxxContext.ts` → `XxxProvider.tsx` → `useXxx.ts`

Uses React 19's `use()` hook to consume context with error handling:

```ts
import { use } from "react";
import { BoardContext } from "./BoardContext";

export function useBoard() {
  const context = use(BoardContext);

  if (!context) {
    throw new Error("useBoard must be used within BoardProvider");
  }

  return context;
}
```

---

## Chrome Built-in AI Hooks

Located in `src/shared/hooks/ai/`

- `useTranslator` – translate text
- `useProofreader` – grammar and spelling
- `useRewriter` – tone rewriter
- `useLanguageDetector` – detect input language
- `useLanguageModel` – word suggestions
- `useWriter` – AI writing (tone, length, format)

Each hook returns:

- `isXxxSupported` – boolean, feature detection
- `downloadProgress` – number (0–1), model download status
- `createXxx` – async function to create the AI instance

Uses types in `chrome-builtin-ai.d.ts`

Example:

```ts
const { createTranslator, isTranslatorSupported } = useTranslator();

if (isTranslatorSupported) {
  const translator = await createTranslator({
    sourceLanguage: "en",
    targetLanguage: "es",
  });

  if (translator) {
    const result = await translator.translate(text);
  }
}
```

Pattern:

```ts
interface ChromeAIHook {
  isXxxSupported: boolean;
  downloadProgress: number;
  createXxx: (options?: T) => Promise<XxxInstance | null>;
}
```

---

## Data Layer

Uses **IndexedDB via `idb`** (`boards-db.ts`)  
Stores:

- `boardsets` – metadata
- `boards` – OBF JSON
- `assets` – image/audio blobs

Supports **Open Board Format (OBF/OBZ)** with schema validation via Zod in `open-board-format/`

---

## Testing

**Vitest 4 + Playwright browser mode** (`@vitest/browser-playwright`)
Used for full-DOM and AI-hook integration tests; tests are colocated next to source files.

```ts
import { expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useTranslator } from "./useTranslator";

test("should be supported", async () => {
  const { result } = await renderHook(() => useTranslator());
  expect(result.current.isTranslatorSupported).toBe(true);
});
```

---

## Code Conventions

- **React:** Function components only, named exports
- **React 19:** Uses `use()` hook for context consumption
- **Props:** `interface ComponentNameProps`
- **TypeScript:** Strict mode, prefer `interface` over `type`
- **Naming:** Components PascalCase, Hooks camelCase, Tests `*.test.tsx`
- **MUI:** v7 + Emotion, subpath imports (`@mui/material/Button`)
- **Formatting:** Enforced by ESLint + Prettier
- **Build:** Vite 7 with PWA plugin for offline support

---

## ❌ Anti-Patterns

- Class components
- Relative imports across features
- Manual memoization
- Missing `isXxxSupported` checks
- Unsafe type assertions (`as`)

---

## Common Patterns

```ts
// Persistent state
const [theme, setTheme] = usePersistentState("theme", "light");

// Router params (from react-router v7)
const { setId, boardId } = useParams<{ setId: string; boardId: string }>();

// Progressive enhancement
const { createProofreader, isProofreaderSupported } = useProofreader();

if (isProofreaderSupported) {
  const proofreader = await createProofreader();

  if (proofreader) {
    const corrected = await proofreader.proofread(text);
  }
}
```

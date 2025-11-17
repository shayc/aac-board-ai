# AAC Board AI - Copilot Instructions

## Project Overview

**AAC Board AI** is a client-side React PWA that enhances pictogram-based AAC (Augmentative and Alternative Communication) boards with Chrome's Built-in AI (Gemini Nano). All processing happens on-device for privacy and offline capability.

**Key Technologies:** React 19, TypeScript 5.9, Material UI 7, Vite 7, IndexedDB, Chrome Built-in AI APIs

## Architecture Patterns

### Feature-Sliced Design

The codebase follows feature-sliced principles with clear separation of concerns:

```
src/
├── app/              # App shell, global dialogs, header, drawers
├── features/board/   # Self-contained board feature
├── shared/           # Reusable contexts, hooks, utilities
└── pages/            # Routed page components
```

Each feature encapsulates its own UI, state, data access, and types. The `board` feature is the primary domain, containing all board-specific logic.

### Path Aliases (Required)

Always use path aliases defined in `tsconfig.app.json` and `vite.config.ts`:

```typescript
import { useBoard } from "@features/board/context/useBoard";
import { useTranslator } from "@shared/hooks/ai/useTranslator";
import { AppShell } from "@app/shell/AppShell";
```

**Do not use relative imports** across feature boundaries.

### Context-Based State Management

State is managed via composed React Context providers in `AppProviders.tsx`:

```typescript
ThemeProvider → SnackbarProvider → SpeechProvider →
LanguageProvider → AIProvider → BoardProvider
```

- **Global contexts** live in `shared/contexts/` (AI, Language, Speech, Theme, Snackbar)
- **Feature contexts** live within features (e.g., `features/board/context/BoardProvider`)
- Each context exports a custom hook (e.g., `useAI()`, `useBoard()`)

**Access context via hooks only** - never import context directly in components.

## Chrome Built-in AI Integration

AI capabilities are accessed through **React hooks** in `shared/hooks/ai/`:

```typescript
// Example: Grammar correction
const { createProofreader, isProofreaderSupported } = useProofreader();
const proofreader = await createProofreader();
const corrected = await proofreader.proofread(text);

// Example: Translation
const { createTranslator, downloadProgress } = useTranslator();
const translator = await createTranslator({
  sourceLanguage: "en",
  targetLanguage: "he",
});
const translated = await translator.translate("Hello");
```

**Available AI hooks:**

- `useProofreader` - Grammar/spelling correction
- `useRewriter` - Tone adjustment (casual, formal, neutral)
- `useTranslator` - Language translation
- `useWriter` - Text generation
- `useLanguageModel` - Custom prompts
- `useLanguageDetector` - Language detection

**Key patterns:**

- Check `isXSupported` before creating sessions
- Monitor `downloadProgress` for model downloads (0-1 scale)
- Store session refs with `useRef` to persist across renders
- Clean up sessions in `useEffect` cleanup

## Data Layer (IndexedDB)

All data is stored locally in `boards-db.ts` using `idb` wrapper:

**Structure:**

- `boardsets` - Collection metadata (name, root board, count)
- `boards` - Individual board configurations (OBF format)
- `assets` - Images, sounds, files (as Blobs)

**Key patterns:**

```typescript
// Open database
const db = await openBoardsDB({ nameKeyLocale: "en" });

// Batch operations for efficiency
await bulkPutBoards(db, setId, boardsArray);
await bulkPutAssets(db, setId, assetsArray);

// Get asset URLs (creates object URLs from blobs)
const imageUrl = await getAssetUrlByPath(db, setId, "images/home.png");
const soundUrl = await getAssetUrlByMediaId(db, setId, "sound_123");
```

**Critical rules:**

- Always validate IDs with `validateId()`
- Normalize paths with `normalizePath()` for cross-platform consistency
- Use transactions for multi-store operations
- Close DB connections when done

## Open Board Format (OBF/OBZ)

The app supports the Open Board Format for board import/export:

- **OBF** - Single board JSON file
- **OBZ** - ZIP package with manifest, multiple boards, and assets

**Key files:**

- `shared/open-board-format/obf.ts` - OBF parsing
- `shared/open-board-format/obz.ts` - OBZ extraction/creation
- `shared/open-board-format/schema.ts` - Zod validation schemas

**Pattern:**

```typescript
// Import OBZ
const parsed = await loadOBZ(file);
const { manifest, boards, files } = parsed;

// Create OBZ
const blob = await createOBZ(boards, rootBoardId, resources);
```

## Material UI Conventions

**Critical:** Use mui-mcp server for MUI questions (see `.github/instructions/mui.instructions.md`)

**Import pattern (enforced by ESLint):**

```typescript
// ✅ Correct - subpath imports
import { Button } from "@mui/material/Button";
import { TextField } from "@mui/material/TextField";

// ❌ Wrong - barrel imports blocked
import { Button } from "@mui/material";
```

**Theming:**

- Theme is managed by `shared/contexts/ThemeProvider/ThemeProvider.tsx`
- Use `useColorScheme()` for dark/light mode
- System preference detection is automatic

## Development Workflows

**Start dev server:**

```bash
npm run dev  # http://localhost:5173
```

**Testing:**

```bash
npm test              # Vitest with Playwright browser mode
npm run coverage      # Generate coverage report
```

**Code quality:**

```bash
npm run lint          # ESLint with TypeScript, React, a11y rules
npm run format        # Prettier formatting
```

**Build:**

```bash
npm run build         # TypeScript check + Vite build
npm run preview       # Preview production build
```

**Pre-commit hooks:** Husky + lint-staged runs ESLint and Prettier automatically

## Testing Patterns

Testing uses **Vitest with browser mode** (Playwright):

```typescript
import { test } from "vitest";
import { renderHook } from "vitest-browser-react";

test("hook behavior", async () => {
  const { result } = await renderHook(() => useTranslator());
  // assertions...
});
```

Tests live alongside source files (`*.test.tsx`). Run specific tests with `npm test -- path/to/file.test.tsx`.

## Browser Requirements

**Chrome 138+** with flags enabled:

```
chrome://flags/#proofreader-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
```

The app uses progressive enhancement:

- **Core:** Works without AI (board navigation, speech synthesis)
- **Enhanced:** AI features activate when available

Check capabilities with `getAICapabilities()` from `shared/hooks/ai/getAICapabilities.ts`.

## Key Files to Reference

- `docs/architecture.md` - Comprehensive architecture documentation
- `src/app/AppProviders.tsx` - Context composition pattern
- `src/features/board/hooks/useCommunicationBoard.ts` - Main board logic
- `src/features/board/db/boards-db.ts` - Complete IndexedDB API
- `src/shared/hooks/ai/` - All AI integration hooks
- `eslint.config.js` - Code quality rules and conventions
- `vite.config.ts` - Build configuration and path aliases

## Common Pitfalls

1. **Never use relative imports across features** - Always use path aliases
2. **Don't import contexts directly** - Use the provided hooks (`useBoard()`, `useAI()`, etc.)
3. **Don't forget to close IndexedDB** - Use `closeBoardsDB(db)` when done
4. **Material UI imports** - Subpath imports only (ESLint will catch this)
5. **AI feature availability** - Always check `isXSupported` before creating sessions
6. **Path normalization** - Use `normalizePath()` for all asset paths to handle Windows/Unix differences

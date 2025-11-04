# Architecture

## Overview

**AAC Board AI** is a client-side React app powered by **Chrome’s Built-in AI (Gemini Nano)**, providing private, on-device communication assistance for people with speech disabilities — no servers, no cloud, no data leaving the browser.

The architecture follows **feature-sliced design** principles, keeping UI, logic, and data layers isolated and easy to maintain.

---

## AI Integration

Chrome's Built-in AI capabilities are accessed through **standalone React hooks** in `shared/hooks/ai/`.  
Each hook directly wraps a browser API — no global state or providers required.

### Available AI Hooks

| Hook                  | Chrome API            | Purpose                                   |
| --------------------- | --------------------- | ----------------------------------------- |
| `useProofreader`      | Proofreader API       | Grammar and spelling correction           |
| `useRewriter`         | Rewriter API          | Tone adjustment (casual, formal, neutral) |
| `useTranslator`       | Translator API        | Real-time translation                     |
| `useWriter`           | Writer API            | Text generation and completion            |
| `useLanguageModel`    | Language Model API    | Custom prompts and advanced use cases     |
| `useLanguageDetector` | Language Detector API | Automatic language detection              |

### Example

```typescript
const { createTranslator } = useTranslator();
const translator = await createTranslator({
  sourceLanguage: "en",
  targetLanguage: "he",
});
```

---

## Tech Stack

**Core:** React 19 • TypeScript 5.9 • Vite 7  
**UI:** Material UI 7 • Emotion  
**Routing:** React Router 7  
**Storage:** IndexedDB (`idb`) — board data and settings  
**AI:** Chrome Built-in AI (Gemini Nano)  
**Validation:** Zod 4  
**Testing:** Vitest + Playwright browser mode

**Highlights**

- React Compiler for automatic optimization
- State managed via React Context (Theme, Speech, Language, AI, Board, Snackbar)
- 100% client-side — no backend or network dependencies

---

## Design Principles

### 1. Feature-Sliced Design

Each feature (e.g. `features/board/`) is a self-contained module with its own UI, logic, data access, and types.  
This modular structure supports scalability and independent development.

### 2. Path Aliases

Simplified imports for clean structure:

```typescript
import { useBoard } from "@features/board/context/useBoard";
import { useTranslator } from "@shared/hooks/ai/useTranslator";
```

Aliases defined in `tsconfig.app.json` and `vite.config.ts`:

- `@app` → `src/app`
- `@features` → `src/features`
- `@shared` → `src/shared`
- `@pages` → `src/pages`

---

## Project Structure

```
src/
├── app/                   # App shell and global layout
│   ├── AppProviders.tsx   # Composed context providers
│   ├── dialogs/           # Global dialogs
│   └── shell/             # Header, drawers, layout
├── features/
│   └── board/             # AAC board feature
│       ├── components/    # UI components
│       ├── context/       # Board state
│       ├── db/            # IndexedDB operations
│       ├── hooks/         # Feature-specific hooks
│       ├── mappers/       # OBF format mapping
│       └── types.ts
├── pages/                 # Routed pages
│   ├── HomePage.tsx
│   ├── BoardPage.tsx
│   └── AboutPage.tsx
└── shared/                # Reusable utilities
    ├── components/        # Shared UI
    ├── contexts/          # Global contexts
    ├── hooks/
    │   └── ai/            # Chrome AI hooks
    ├── open-board-format/ # OBF/OBZ parsing
    ├── types/
    └── utils/
```

---

## Data Storage

**IndexedDB** (via `idb`) stores:

- Board sets and individual boards (parsed from OBZ files)

All data is stored locally — no sync or cloud dependency.

---

## Browser Compatibility

**Requirements**

- Chrome 138+
- Manual flag enablement for AI features:

```
chrome://flags/#proofreader-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
```

Once enabled, Chrome downloads the Gemini Nano model for local inference.

---

## Progressive Enhancement

AAC Board AI adapts gracefully to the browser's capabilities:

- **Core mode:** Board navigation, message composition, and speech synthesis run fully offline.
- **Enhanced mode:** When Chrome AI APIs are available, phrasing, tone, and translation are improved automatically.

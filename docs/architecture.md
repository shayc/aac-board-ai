# Architecture

## Overview

**AAC Board AI** is a fully client-side React application powered by **Chrome’s Built-in AI (Gemini Nano)**.  
It provides private, on-device communication assistance for people with speech disabilities — running entirely in the browser without servers or cloud dependencies.

The architecture follows **feature-sliced design** principles to keep UI, logic, and data isolated and independently maintainable.

---

## AI Integration

Chrome’s Built-in AI APIs are accessed through stateless React hooks in `shared/hooks/ai/`.  
Each hook wraps a browser API directly — no providers, global state, or network calls required.

### Available Capabilities

- **Proofreader API** — Grammar and spelling correction
- **Rewriter API** — Tone adjustment (casual, formal, neutral)
- **Translator API** — Real-time translation between languages
- **Writer API** — Text generation and completion
- **Language Model API** — Custom prompts and advanced use cases
- **Language Detector API** — Automatic language detection

### Usage Example

```typescript
const translator = useTranslator();
const result = await translator.translate("Hello", "es");
```

All hooks automatically detect feature availability and degrade gracefully when AI isn’t supported:

```typescript
const { available } = useTranslator();
if (available === "no") {
  // Fallback to non-AI behavior
}
```

### Resilience & Fallbacks

- The app remains fully functional even without AI.
- Users receive clear feedback when AI capabilities are unavailable.
- All critical AAC functionality (board navigation, message composition, speech synthesis) works offline.

---

## Tech Stack

**Core:** React 19 • TypeScript 5.9 • Vite 7  
**UI:** Material UI 7 • Emotion  
**Routing:** React Router 7  
**Storage:** IndexedDB (via `idb`)  
**AI:** Chrome Built-in AI APIs (Proofreader, Rewriter, Translator, Writer, Language Model)  
**Validation:** Zod  
**Testing:** Vitest + Playwright

**Highlights**

- React Compiler enabled for automatic optimization
- State managed with React Context (no Redux or external store)
- 100% client-side — no backend or network dependencies

---

## Design Principles

### 1. Feature-Sliced Design

Each feature (for example, `features/board/`) is a self-contained module with its own UI, logic, data, and types.  
This separation keeps the project scalable and easy to maintain.

### 2. Separation of Concerns

- **Contexts** (`shared/contexts/`) hold global app state — theme, speech, language, AI settings.
- **Hooks** (`shared/hooks/ai/`) wrap browser AI APIs without state, making them portable and independent.

### 3. Path Aliases

Simplified imports with clear namespaces:

```typescript
import { useBoard } from "@features/board/context/useBoard";
import { useTranslator } from "@shared/hooks/ai/useTranslator";
```

Aliases are defined in `tsconfig.app.json` and `vite.config.ts`:

- `@app` → `src/app`
- `@features` → `src/features`
- `@shared` → `src/shared`
- `@pages` → `src/pages`

---

## Project Structure

```
src/
├── app/
├── features/
│   └── board/
│       ├── components/
│       ├── context/
│       ├── db/
│       ├── hooks/
│       ├── mappers/
│       └── types.ts
├── pages/
│   ├── HomePage.tsx
│   ├── BoardPage.tsx
│   └── AboutPage.tsx
└── shared/
    ├── components/
    ├── contexts/
    ├── hooks/
    │   └── ai/
    ├── open-board-format/
    ├── types/
    └── utils/
```

---

## Browser Compatibility

**Requirements**

- **Browser:** Chrome 138+
- **AI Features:** Require manual flag enablement

Enable these Chrome flags to unlock Built-in AI APIs:

```
chrome://flags/#proofreader-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
```

After enabling, Chrome downloads the Gemini Nano model (~1.7 GB) for local processing.

---

## Progressive Enhancement

AAC Board AI is built with progressive enhancement in mind:

1. **Core AAC features** (board navigation, message building, speech synthesis) work without AI.
2. **AI features** enhance phrasing, tone, and translation when available.
3. **Feature detection** ensures graceful fallback when APIs are disabled or unsupported.

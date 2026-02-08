# Architecture

## Overview

**AAC Board AI** is a client-side React app powered by **Chrome’s Built-in AI (Gemini Nano)**, providing private, on-device communication assistance for people with speech disabilities — no servers, no cloud, no data leaving the browser.

The architecture follows **feature-sliced design** principles, keeping UI, logic, and data layers isolated and easy to maintain.

---

## AI Integration

Chrome's Built-in AI capabilities are accessed through **React hooks** in `shared/hooks/ai/`.  
Each hook wraps a browser API and manages model downloading and session lifecycle.

### AI Hooks

| Hook                  | Chrome API            | Status       | Purpose                                          |
| --------------------- | --------------------- | ------------ | ------------------------------------------------ |
| `useProofreader`      | Proofreader API       | ✅ Active    | Grammar and spelling correction                  |
| `useRewriter`         | Rewriter API          | ✅ Active    | Tone adjustment (direct, professional, friendly) |
| `useTranslator`       | Translator API        | ✅ Active    | Real-time translation                            |
| `useWriter`           | Writer API            | 🔧 Available | Text generation and completion                   |
| `useLanguageModel`    | Language Model API    | 🔧 Available | Custom prompts for word suggestions              |
| `useLanguageDetector` | Language Detector API | 🔧 Available | Automatic language detection                     |

**Status Key:**

- ✅ **Active** - Currently used in the application
- 🔧 **Available** - Implemented but not yet integrated into UI

### Example

```typescript
// Creating a translator
const { createTranslator, isTranslatorSupported, downloadProgress } =
  useTranslator();

if (isTranslatorSupported) {
  const translator = await createTranslator({
    sourceLanguage: "en",
    targetLanguage: "he",
  });

  const translated = await translator.translate("Hello world");
}
```

**Shared Context**

The `AIProvider` context manages shared context across AI sessions, allowing you to provide background information that enhances AI responses across different features.

---

## Tech Stack

**Core:** React 19 • TypeScript 5.9 • Vite 7  
**UI:** Material UI 7 • Emotion • React Aria  
**Routing:** React Router 7  
**Storage:** IndexedDB (`idb`) — board data, assets, and settings  
**Compression:** fflate — OBZ file handling  
**AI:** Chrome Built-in AI (Gemini Nano)  
**Validation:** Zod 4  
**Testing:** Vitest 4 + Playwright browser mode  
**Error Handling:** react-error-boundary

**Highlights**

- React Compiler for automatic optimization
- State managed via React Context (`ThemeProvider`, `SpeechProvider`, `LanguageProvider`, `AIProvider`, `SnackbarProvider`)
- 100% client-side — no backend or network dependencies

---

## Design Principles

### Feature-Sliced Design

Each feature (e.g. `features/board/`) is a self-contained module with its own UI, logic, data access, and types.  
This modular structure supports scalability and independent development.

---

## Project Structure

### Path Aliases

Simplified imports via aliases defined in `tsconfig.app.json` and `vite.config.ts`:

- `@app` → `src/app`
- `@features` → `src/features`
- `@shared` → `src/shared`
- `@pages` → `src/pages`

```
src/
├── app/                   # App shell and global layout
│   ├── AppProviders.tsx   # Composed context providers
│   ├── AppRoutes.tsx      # Route definitions
│   ├── dialogs/           # Global dialogs
│   ├── drawers/           # Slide-out drawers
│   └── layouts/           # Header, layout components
├── features/
│   └── board/             # AAC board feature
│       ├── components/    # UI components
│       ├── db/            # IndexedDB operations
│       ├── hooks/         # Feature-specific hooks
│       ├── mappers/       # OBF format mapping
│       ├── store/         # External store (board sets)
│       └── types.ts
├── pages/                 # Routed pages
│   ├── HomePage.tsx
│   ├── BoardPage.tsx
│   ├── BoardSetRootRedirect.tsx
│   └── AboutPage.tsx
└── shared/                # Reusable utilities
    ├── components/        # Shared UI
    ├── contexts/          # Global contexts
    ├── hooks/
    │   └── ai/            # Chrome AI hooks
    ├── open-board-format/ # OBF/OBZ parsing
    ├── testing/           # Test utilities
    └── utils/
```

---

## Data Storage

**IndexedDB** (via `idb`) stores:

- **Boardsets** - Metadata for collections of boards
- **Boards** - Individual board configurations (parsed from OBF files)
- **Assets** - Images, sounds, and other media resources (extracted from OBZ packages)

All data is stored locally — no sync or cloud dependency.

---

## Browser Compatibility

Requires Chrome 138+ with Built-in AI flags enabled. See [Prerequisites](../README.md#prerequisites) for the full list of required flags.

Once enabled, Chrome downloads the Gemini Nano model for local inference.

---

## PWA & Offline Support

The app is a **Progressive Web App** powered by `vite-plugin-pwa`:

- **Installable** — users can add it to their home screen on desktop and mobile.
- **Auto-updating service worker** (`registerType: "autoUpdate"`) ensures the latest version loads without manual intervention.
- **Offline-capable** — after the first visit, all app assets are served from the service worker cache.

Configuration lives in `vite.config.ts` under the `VitePWA()` plugin.

---

## Progressive Enhancement

AAC Board AI adapts gracefully to the browser's capabilities:

- **Core mode:** Board navigation, message composition, and speech synthesis run fully offline using Web Speech API. The PWA service worker ensures the app itself loads without a network connection.
- **Enhanced mode:** When Chrome AI APIs are available and enabled, message quality is improved through grammar correction (Proofreader), tone adjustment (Rewriter), and translation (Translator).

This approach ensures the application remains functional even if AI features are unavailable, while providing enhanced capabilities when possible.

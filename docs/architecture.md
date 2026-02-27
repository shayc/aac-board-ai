# Architecture

## Overview

**AAC Board AI** is a client-side React app powered by **Chrome’s Built-in AI (Gemini Nano)**, providing private, on-device communication assistance for people with speech disabilities — no servers, no cloud, no data leaving the browser.

The architecture follows **feature-sliced design** principles — each feature is a self-contained module with its own UI, logic, data access, and types. Features may import from `shared/` but not from each other or from `app/`.

---

## AI Integration

Chrome's Built-in AI capabilities are accessed through **React hooks** in `shared/hooks/ai/`.  
Each hook wraps a browser API, tracks capability support, and manages download progress.

### AI Hooks

| Hook                  | Chrome API            | Status       | Purpose                                          |
| --------------------- | --------------------- | ------------ | ------------------------------------------------ |
| `useProofread`        | Proofreader API       | ✅ Active    | Grammar and spelling correction                  |
| `useRewrite`          | Rewriter API          | ✅ Active    | Tone adjustment (direct, professional, friendly) |
| `useTranslator`       | Translator API        | ✅ Active    | Real-time translation                            |
| `useWriter`           | Writer API            | 🔧 Available | Text generation and completion                   |
| `useLanguageModel`    | Language Model API    | 🔧 Available | Custom prompts for word suggestions              |
| `useLanguageDetector` | Language Detector API | 🔧 Available | Automatic language detection                     |

**Status Key:**

- ✅ **Active** — Currently used in the application
- 🔧 **Available** — Implemented but not yet integrated into UI

The `AIProvider` context manages shared context across AI sessions. Users can provide background information (e.g. communication preferences) that enhances AI responses across different features.

---

## Tech Stack

**Core:** React 19 • TypeScript 5.9 • Vite 7  
**UI:** Material UI 7 • Emotion • React Aria  
**Routing:** React Router 7  
**Storage:** IndexedDB (`idb`) + localStorage  
**Data:** open-board-format (OBF/OBZ parsing)  
**AI:** Chrome Built-in AI (Gemini Nano)  
**Optimization:** React Compiler  
**Testing:** Vitest 4 + Playwright browser mode  
**Error Handling:** react-error-boundary

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
    ├── testing/           # Test utilities
    └── utils/
```

---

## State Management

All data stays on the device. Three storage layers, chosen by data weight and lifetime:

| Layer                 | What lives there                                              | Access                                      |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| **IndexedDB** (`idb`) | Board sets, boards, media assets (images/sounds)              | Feature DB helpers (`boards-db.ts`)         |
| **localStorage**      | User preferences — language, message draft, AI shared context | `usePersistentState` hook                   |
| **React Context**     | Runtime state — theme, speech, snackbar, AI download progress | Provider hooks (`useTheme`, `useSpeech`, …) |

Board-set data is consumed by components via a custom external store (`useSyncExternalStore`) with `BroadcastChannel` cross-tab sync — importing or deleting a board set in one tab is reflected in all others.

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

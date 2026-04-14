# Architecture

## Overview

**AAC Board AI** is a client-side React app powered by **Built-in AI**, providing private, on-device communication assistance for people with speech disabilities — no servers, no cloud, no data leaving the browser.

The architecture follows **feature-sliced design** principles — each feature is a self-contained module with its own UI, logic, data access, and types. Features may import from `shared/` but not from each other or from `app/`.

---

## AI Integration

Built-in AI capabilities are accessed through **React hooks** in `shared/ai/`.  
Each hook wraps a browser API, tracks capability support, and manages download progress.

### AI Hooks

| Hook             | API             | Purpose                                          |
| ---------------- | --------------- | ------------------------------------------------ |
| `useProofreader` | Proofreader API | Grammar and spelling correction                  |
| `useRewriter`    | Rewriter API    | Tone adjustment (direct, professional, friendly) |
| `useTranslator`  | Translator API  | Real-time translation                            |

The `AIProvider` context manages shared context across AI sessions. Users can provide background information (e.g. communication preferences) that enhances AI responses across different features.

---

## Tech Stack

**Core:** React 19 • TypeScript 6 • Vite 8  
**UI:** Material UI 9 • Emotion • React Aria  
**Routing:** React Router 7  
**Storage:** IndexedDB (`idb`) + localStorage  
**Data:** open-board-format (OBF/OBZ parsing)  
**AI:** Built-in AI  
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
├── app/                   # App shell and layout
│   ├── AppProviders.tsx
│   ├── AppRoutes.tsx
│   ├── dialogs/           # Onboarding and app-level dialogs
│   ├── drawers/           # Menu and settings panels
│   ├── hooks/             # App-scoped hooks (page title, etc.)
│   └── layouts/           # Header and shell chrome
├── features/
│   └── board/             # The AAC communication board
│       ├── grid/          # Tappable tile grid with keyboard nav
│       ├── message/       # Sentence strip with playback controls
│       ├── navigation/    # Back, home, and board-linking logic
│       ├── suggestions/   # AI-powered phrase and tone suggestions
│       ├── storage/       # IndexedDB persistence and board-set state
│       ├── import/        # OBZ/OBF file ingestion and format mapping
│       └── *.tsx / *.ts   # Root orchestrators, types, public barrel
├── pages/                 # One file per route
│   ├── AboutPage.tsx
│   ├── BoardPage.tsx
│   ├── BoardSetRootRedirect.tsx
│   ├── HomePage.tsx
│   └── LibraryPage/       # Board set browsing and management
└── shared/                # Cross-cutting code used by any feature
    ├── ai/                # Built-in AI capability detection and hooks
    ├── components/        # Shared UI primitives
    ├── hooks/             # Reusable stateful hooks
    ├── language/          # Locale detection and language context
    ├── snackbar/          # Snackbar notification system
    ├── speech/            # Text-to-speech synthesis
    ├── testing/           # Fixtures and sample board files
    ├── theme/             # MUI theme configuration
    └── utils/             # Pure utility functions
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

Requires Chrome 138+ with Built-in AI flags enabled. See [Enabling Built-in AI](../README.md#enabling-built-in-ai) for the full list of required flags.

Once enabled, the browser downloads the AI model for local inference.

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
- **Enhanced mode:** When Built-in AI APIs are available and enabled, message quality is improved through grammar correction (Proofreader), tone adjustment (Rewriter), and translation (Translator).

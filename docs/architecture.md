# Architecture

> **Audience:** contributors and coding agents making non-trivial changes to this repo. For a project introduction, see the [README](../README.md).

## 1. System overview

A client-side React 19 app that renders [Open Board Format](./external/open-board-format.md) communication boards from an in-browser IndexedDB store. Imported `.obf` / `.obz` files are parsed and persisted; boards are loaded on demand, optionally translated through the browser's Built-in AI Translator, and rendered as a keyboard-navigable tile grid that drives a message strip with text-to-speech playback. There is no backend — every byte stays on the device.

Built-in AI is a **leaf-level enhancement**, not the architecture: when available, it adds proofreading and rewriting suggestions to the message strip and translation to board labels. Everything else works without it.

## 2. Module boundaries

The codebase is **feature-sliced**. The single feature today is `board`. Layers and import rules:

- `@app/*` — app shell, providers, routing, top-level dialogs/drawers.
- `@features/*` — self-contained feature modules. May import from `@shared/*`. Must **not** import from `@app/*` or from each other.
- `@pages/*` — route components. Compose features and shared UI.
- `@shared/*` — cross-cutting code (AI capability hooks, speech, language, snackbar, theme, utilities). No knowledge of features.

Aliases are declared in [tsconfig.app.json](../tsconfig.app.json) and mirrored in [vite.config.ts](../vite.config.ts).

**Public-barrel rule.** UI layers consume the board feature through [`@features/board`](../src/features/board/index.ts). Reaching into `storage/`, `obf/`, or other internals from outside the feature is disallowed by convention. The barrel exposes `BoardView`, `useBoard`, `useBoardSets`, `useImportBoardFiles`, and the imperative store functions (`fetchBoardSets`, `importBoardFromUrl`, `removeBoardSet`).

**See:** [tsconfig.app.json](../tsconfig.app.json), [src/features/board/index.ts](../src/features/board/index.ts).

## 3. Routing

Single React Router `BrowserRouter`. All routes share `<AppShell>` (header, drawers, onboarding dialog, `<Outlet>`).

| Path                           | Component              | Lazy | Notes                                               |
| ------------------------------ | ---------------------- | ---- | --------------------------------------------------- |
| `/`                            | `HomePage`             | no   | Resolves initial board; honors `?board=<url>` query |
| `/sets/:setId`                 | `BoardSetRootRedirect` | no   | Redirects to the set's root board                   |
| `/sets/:setId/boards/:boardId` | `BoardPage`            | yes  | The board renderer                                  |
| `/library`                     | `LibraryPage`          | yes  | Browse, import, delete board sets                   |
| `/about`                       | `AboutPage`            | yes  | Static content                                      |

Lazy routes are wrapped in `<AsyncBoundary>` (`<Suspense>` + `react-error-boundary`). Board-to-board navigation goes through `useBoardNavigation`, which carries a `backStack: string[]` on `location.state` for a board-aware back button distinct from browser history.

**See:** [src/app/AppRoutes.tsx](../src/app/AppRoutes.tsx), [src/shared/components/AsyncBoundary.tsx](../src/shared/components/AsyncBoundary.tsx), [src/features/board/navigation/useBoardNavigation.ts](../src/features/board/navigation/useBoardNavigation.ts).

## 4. Provider stack

`AppProviders` composes context in this order, outer to inner:

```
ThemeProvider
└─ SnackbarProvider
   └─ SpeechProvider           // owns the Web Speech API state
      └─ LanguageProvider      // consumes SpeechProvider to map language → voice
         └─ AIProvider         // shared AI context + download-progress aggregation
```

Order is load-bearing. `LanguageProvider` reads `useSpeech()` to discover available voices and pick a default for the current language, so it must sit inside `SpeechProvider`. `AIProvider` is innermost so any descendant — including `LanguageProvider`-aware components — can read AI download state.

**See:** [src/app/AppProviders.tsx](../src/app/AppProviders.tsx), [src/shared/language/LanguageProvider.tsx](../src/shared/language/LanguageProvider.tsx).

## 5. Data flow

The end-to-end pipeline from imported file to spoken message:

```mermaid
flowchart TD
  subgraph Import
    A[File / URL] --> B[storeBoardFiles]
    B --> C[(IndexedDB:<br/>boardsets · boards · assets)]
  end

  subgraph Sync
    C -. invalidate .-> D[board-sets-store<br/>external store]
    D <-. BroadcastChannel .-> D2[Other tabs]
    D --> E[useBoardSets<br/>useSyncExternalStore]
  end

  subgraph Render
    F[BoardPage<br/>:setId/:boardId] --> G[useBoard]
    G --> H[useLoadBoard]
    H --> C
    H --> I[ObjectURL registry<br/>per board]
    H --> J[obfToBoard]
    G --> K[useBoardTranslation]
    K -. optional .-> L[Translator API]
    K -. cache .-> C
    J --> M[BoardView]
    K --> M
  end

  E --> F
```

IndexedDB is the convergence point: it's written by import, read by board loading, and re-read after translation caches its results. The board-sets external store is invalidated whenever import or delete completes, and a `BroadcastChannel` propagates the invalidation to every open tab. From `BoardView`, tile activations flow through `useButtonActivation` into `useMessage` (localStorage) and `useBoardNavigation`; per-button preview plays directly through `useSpeech` / `useAudio`, while the message-bar play button uses `useMessagePlayback` — see Speech & audio for playback and Storage for persistence.

**See:** [src/features/board/storage/board-import.ts](../src/features/board/storage/board-import.ts), [src/features/board/storage/board-sets-store.ts](../src/features/board/storage/board-sets-store.ts), [src/features/board/useLoadBoard.ts](../src/features/board/useLoadBoard.ts), [src/features/board/useBoardTranslation.ts](../src/features/board/useBoardTranslation.ts), [src/features/board/useButtonActivation.ts](../src/features/board/useButtonActivation.ts).

## 6. Storage

Three layers, by lifetime.

**IndexedDB** — database `aac-board-db`, version 1.

| Object store | Key                | Indexes                     | Holds                                      |
| ------------ | ------------------ | --------------------------- | ------------------------------------------ |
| `boardsets`  | `setId`            | `byUpdatedAt`               | `BoardSetRecord` — metadata per import     |
| `boards`     | `[setId, boardId]` | `bySetId`                   | `BoardRecord` — the OBF JSON for one board |
| `assets`     | `[setId, path]`    | `bySetId`, `bySetIdMediaId` | `AssetRecord` — image/sound `Blob`s        |

Access goes through helpers in `boards-db.ts`. `withBoardsDB(operation)` opens the DB, runs the callback, and closes — connections are not pooled. Deletes use bound `IDBKeyRange` to remove all rows for a `setId` in a single transaction.

**localStorage** — via `usePersistentState`.

| Key                 | Holds                                  | Owner                                                           |
| ------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `language`          | Selected primary language subtag       | [LanguageProvider](../src/shared/language/LanguageProvider.tsx) |
| `message`           | Current `MessagePart[]` (draft)        | [useMessage](../src/features/board/message/useMessage.ts)       |
| `ai-shared-context` | User-supplied free-text custom prompt  | [AIProvider](../src/shared/ai/AIProvider.tsx)                   |
| `hasSeenOnboarding` | Boolean — has the welcome dialog shown | [useOnboarding](../src/app/dialogs/useOnboarding.ts)            |

**React Context** — runtime only.

| Context              | Provides                                                                              |
| -------------------- | ------------------------------------------------------------------------------------- |
| `ThemeContext` (MUI) | Theme; consumed via `sx` callbacks, no custom `useTheme`                              |
| `SnackbarContext`    | `showSnackbar` + queued `<Snackbar>` UI                                               |
| `SpeechContext`      | Voices, locales, rate/pitch/volume, `speak`/`cancel`                                  |
| `LanguageContext`    | Available languages, selected language, `setLanguage`                                 |
| `AIContext`          | `sharedContext` (persisted), `downloads` (progress 0–1 per capability), `setDownload` |

**Cross-tab sync.** `board-sets-store.ts` builds an external store with `createExternalStore` (a tiny `Set<listener>` + state) and exposes it through `useBoardSets` via `useSyncExternalStore`. Mutations call `invalidateAndBroadcast`, which refreshes the local snapshot and posts to a `BroadcastChannel("board-sets-sync")`; other tabs receive the message and refresh their own snapshots.

**ObjectURL lifecycle.** `useLoadBoard` allocates a fresh `ObjectUrlRegistry` per load and `revokeAll()`s the previous one on success or unmount, preventing blob-URL leaks across navigations.

**See:** [src/features/board/storage/boards-db.ts](../src/features/board/storage/boards-db.ts), [src/features/board/storage/board-sets-store.ts](../src/features/board/storage/board-sets-store.ts), [src/shared/utils/external-store.ts](../src/shared/utils/external-store.ts), [src/shared/utils/object-url.ts](../src/shared/utils/object-url.ts), [src/shared/hooks/usePersistentState.ts](../src/shared/hooks/usePersistentState.ts).

## 7. AI integration

The app adapts to the browser's capabilities, not its version. There is no hard-coded minimum version.

- **Always works:** board rendering, navigation, message composition, text-to-speech (Web Speech API), board import, offline use.
- **Enhanced when available** — each capability is detected at module load (`"X" in self`); UI components condition on the matching boolean and the affordance is hidden when missing, never broken:
  - **Translator API** → translates board labels into the user's language and caches the result.
  - **Rewriter API** → tone-adjusted phrase suggestions in `SuggestionBar`.
  - **Proofreader API** → grammar/spelling correction suggestions in `SuggestionBar`.

For instructions to enable Built-in AI in supported browsers, see [Enabling Built-in AI](../README.md#enabling-built-in-ai).

### Capability detection

`capabilities.ts` exports three booleans evaluated once at module load: `isProofreaderSupported`, `isRewriterSupported`, `isTranslatorSupported`. Read directly by `AICapabilitiesList`, `AISettings`, `LanguageSettings`, and `useSuggestions`.

### Session caching

Each AI hook (`useProofreader`, `useRewriter`, `useTranslator`) holds a single live session in a `useRef`. Subsequent calls reuse that session unless the relevant options change (language pair for translator, tone/format/length/sharedContext for rewriter). This avoids paying creation cost — including model download — on every keystroke.

### Download-progress aggregation

`AIProvider` owns a `downloads: Record<string, number>` keyed by capability name. Each hook subscribes to `downloadprogress` on its session monitor and writes `event.loaded` (0–1) to the matching key via `setDownload`. `LanguageSettings` reads `downloads.translator` to render a progress message.

### Where `sharedContext` is actually used

The persisted `ai-shared-context` string is currently passed only through `useSuggestions` into `createRewriter({ sharedContext })`. The translator and proofreader hooks do not consume it today.

### Suggestions composition

`useSuggestions` runs the proofreader and rewriter in parallel against a shared `AbortController`, cancels in-flight calls when the input changes, dedupes results, and filters out low-quality outputs (entries with underscored tokens or stray quote marks).

**See:** [src/shared/ai/capabilities.ts](../src/shared/ai/capabilities.ts), [src/shared/ai/AIProvider.tsx](../src/shared/ai/AIProvider.tsx), [src/shared/ai/useTranslator.ts](../src/shared/ai/useTranslator.ts), [src/shared/ai/useRewriter.ts](../src/shared/ai/useRewriter.ts), [src/shared/ai/useProofreader.ts](../src/shared/ai/useProofreader.ts), [src/features/board/suggestions/useSuggestions.ts](../src/features/board/suggestions/useSuggestions.ts).

## 8. Speech & audio

Two engines play message parts:

- **`useSpeech` / `useSpeechSynthesis`** — wraps the Web Speech API: voice list (refreshed on `voiceschanged`), per-utterance rate/pitch/volume, promise-returning `speak`. Voices are grouped by language and locale for the language picker.
- **`useAudio`** — plays an OBF sound asset (already a blob URL from the ObjectURL registry) one at a time; `play()` returns a promise that resolves on `ended` or rejects when `stop()` is called.

`useMessagePlayback` interleaves them: it walks each `MessagePart` in order; if the part has a `soundSrc`, it plays the audio; otherwise it speaks the `vocalization ?? label`. Adjacent text parts are merged into a single utterance to avoid clipped speech between words.

**See:** [src/shared/speech/useSpeechSynthesis.ts](../src/shared/speech/useSpeechSynthesis.ts), [src/shared/hooks/useAudio.ts](../src/shared/hooks/useAudio.ts), [src/features/board/message/useMessagePlayback.ts](../src/features/board/message/useMessagePlayback.ts).

## 9. Internationalization

Both [OBF](./external/open-board-format.md) (`board.locale`) and the Web Speech API (`voice.lang`) use [BCP-47](https://www.rfc-editor.org/info/bcp47) tags. The app splits them into two roles:

| Term       | Meaning                              | Examples          |
| ---------- | ------------------------------------ | ----------------- |
| `locale`   | Full BCP-47 tag (language + region). | `"en"`, `"en-US"` |
| `language` | Primary subtag only.                 | `"en"`, `"pt"`    |

Helpers in [src/shared/language/locale.ts](../src/shared/language/locale.ts): `normalizeLocaleCode` (canonical casing) and `getPrimaryLanguage` (locale → language).

### Translation caching

When the user's selected language differs from a board's locale, `useBoardTranslation`:

1. Checks `board.strings[language]` for an existing translation. If present, applies it and stops.
2. Otherwise, creates a `Translator` for the language pair, translates every label and vocalization in parallel, and applies the result to a derived `Board`.
3. Persists the translated dictionary back into the OBF JSON via `updateBoardStrings`, so subsequent loads (this session or any future one, in any tab) hit the cache instead of the AI.

If the Translator capability is unavailable, the original board is shown unchanged.

**See:** [src/features/board/useBoardTranslation.ts](../src/features/board/useBoardTranslation.ts), [src/features/board/storage/boards-db.ts](../src/features/board/storage/boards-db.ts).

## 10. PWA & offline

Powered by `vite-plugin-pwa`:

- **Installable** on desktop and mobile.
- **Auto-updating** service worker (`registerType: "autoUpdate"`) — the latest build loads without user action.
- **Offline-capable** — after the first visit, all app assets are served from the service worker cache. Imported board sets and assets are already in IndexedDB, so the app remains fully functional without a network.

Configuration lives in [vite.config.ts](../vite.config.ts) under the `VitePWA()` plugin.

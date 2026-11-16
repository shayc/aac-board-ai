# Architecture

AAC Board AI is a device-local progressive web app (PWA) for people who cannot
rely on speech. Users select tiles to compose messages that the browser can
speak. The app uses React, TypeScript, Vite, MUI, and React Router. Built-in AI
provides optional, on-device language help.

Accessibility comes first, followed by offline reliability, privacy,
responsiveness, and internationalization.

See [README.md](../README.md) for product details and setup,
[AGENTS.md](../AGENTS.md) for contribution and testing rules, and the
[glossary](#glossary) for AAC terms.

- [Invariants](#invariants)
- [Runtime architecture](#runtime-architecture)
- [Data and state ownership](#data-and-state-ownership)
- [Module boundaries and code map](#module-boundaries-and-code-map)
- [Core flows](#core-flows)
- [Accessibility, language, and presentation](#accessibility-language-and-presentation)
- [Current limitations](#current-limitations)
- [Glossary](#glossary)

The first four sections give the shape of the app. The rest is detail to read
when working in that area.

## Invariants

A change that breaks one of these rules needs a decision, not just a passing
build. Each links to the section that explains it.

- **Core communication never depends on an optional feature.** People rely on
  the app to communicate, so reading, navigating, and composing with a loaded
  board need neither built-in AI nor the network. Speaking needs only a voice
  that is on the device ([Runtime architecture](#runtime-architecture)).
- **No backend, telemetry, or tracking.** Boards, settings, and messages are
  stored only on the device. Beyond its own static host, the app reaches the
  network only for remote media a board points at, for a voice that speaks
  through an online service, and for a board link, after the user confirms its
  host
  ([Runtime architecture](#runtime-architecture), [Start at `/`](#start-at-)).
- **Dependencies run one way.** The app composes features, the board imports
  the library, and shared code imports neither
  ([Module boundaries](#module-boundaries-and-code-map)).
- **Only `library/storage/` touches IndexedDB, and only `board/suggestions/`
  and `library/translation/` use built-in AI.** Oxlint enforces both
  ([Module boundaries](#module-boundaries-and-code-map)).
- **Stored boards keep their OBF structure.** The runtime `Board` is derived on
  each read, and loading never changes the stored record
  ([Data and state ownership](#data-and-state-ownership)).
- **Route loaders only read.** They never translate or wait on a model
  ([Open a board](#open-a-board)).
- **`useMessage` is the one owner of how the message changes.** Tiles,
  shortcuts, and suggestions all edit the message through it
  ([Activate a tile](#activate-a-tile)).
- **Shared playback owns all device output and reads no settings store.** The
  board playback adapter is the only place that reports a failed playback
  ([Activate a tile](#activate-a-tile)).
- **Speech follows the text, not the setting.** A message part whose language
  is known is spoken in that language
  ([Language and direction](#language-and-direction)).
- **A populated grid has one Tab stop.** Arrow keys move inside it and follow
  text direction ([Accessibility](#accessibility)).
- **Scanned controls hold no scanning code.** The scanner reads scan groups
  from the DOM, so the grid and its tiles know nothing about scanning
  ([Switch scanning](#switch-scanning)).

## Runtime architecture

The app is a single-page application (SPA) with no application backend, telemetry,
or tracking. Keeping boards on-device protects communication content and supports
use on restricted networks; the trade-off is no built-in cross-device sync.

A static host serves the app and updates. The service worker caches the app shell
after the first successful load and third-party images as they are displayed.
Once the shell and board are available locally, core communication works offline.
Playback depends on locally available media and speech voices. Storing a board
set asks the browser for persistent storage, so boards are not evicted when the
device runs low on space; browsers may prompt or decline, and the app works
either way.

```mermaid
flowchart LR
    accTitle: AAC Board AI runtime and trust boundaries
    accDescr: The device-local React app stores boards in the browser, uses browser output and optional built-in AI, and contacts network hosts for loading, updates, URL imports, remote media, or a voice-dependent speech service.

    files["Local files<br/>OBF / OBZ"]
    host["Static web host"]
    remote["Remote board / media hosts"]
    voice["Platform speech service<br/>voice-dependent"]

    subgraph browser["User device · browser runtime"]
        SPA["React SPA"]
        SW["Service worker"]
        IDB[("IndexedDB<br/>boards · assets")]
        CACHE[("Cache Storage<br/>app shell · remote images")]
        OUT["Web Speech API · HTML Audio"]
        AI["Built-in AI"]

        SPA <-->|read · write| IDB
        SW <--> CACHE
        SW -->|cached shell · images| SPA
        SPA -->|speak · play| OUT
        SPA -.->|optional language help| AI
    end

    files -->|import| SPA
    host -->|first load| SPA
    host -->|updates| SW
    remote -.->|URL import · remote audio| SPA
    remote -.->|remote images| SW
    OUT -.->|voice-dependent| voice
```

Dashed edges mark optional or platform-dependent integrations.

Built-in AI runs on-device without per-request network access once a model is
available.

## Data and state ownership

State has distinct owners and lifetimes:

| State                 | Owner                                 | Contents                                                                                               |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Durable board data    | IndexedDB through board storage       | Board-set metadata, source OBF records, and asset bytes                                                |
| Active board          | React Router loaders                  | Stored `Board`, and its set's board list and root board, for the current route                         |
| Asset URLs            | Board storage                         | One object URL per loaded asset, kept until board set deletion or page close                           |
| Navigation history    | React Router                          | Browser history with a flag allowing board Back navigation                                             |
| Reactive shared state | `createExternalStore`                 | Board-set library, board-set downloads, board translation status, voice catalog, and playback progress |
| Persisted preferences | `createPersistedStore` + localStorage | Language, speech, tile and message display, switch scanning, suggestion instructions, onboarding       |
| Interaction state     | Local React state                     | In-progress message parts and remembered grid focus                                                    |

Stored boards retain their OBF structure for AAC compatibility, preserving
imported fields while adding translations saved on this device. Board links
carry the linked board's ID, which the OBF library resolves from the archive.
Board-set records store the set's translated names. `obfToBoard` derives the
runtime `Board` on each read, so runtime types can evolve without rewriting
stored records. The storage schema in
[`boards-db.ts`](../src/features/library/storage/boards-db.ts) has no migrations
yet: a schema change edits it in place, and a browser holding an older database
needs its site data cleared.

React Context provides theme, playback controls, and snackbar access.
Components subscribe to external stores through `useExternalStore`, a
`useSyncExternalStore` wrapper that takes an optional selector.

Playback uses slice subscriptions: each component tracks only the progress fields
it needs. Word-boundary updates rerender only components whose selected fields
change.

Device output does not read settings stores. `AppProviders` gives the playback
coordinator a `getSpeechParameters` function, and the coordinator calls it for
each speech step with the language of the step's text, so every utterance uses
that language's voice and the rate, pitch, and volume current at that moment.

The board-set library broadcasts changes so other tabs can refresh their lists.
Preferences managed by `createPersistedStore` reload when another tab writes
their key, through the window `storage` event. A reload does not write the value
back: only a change made in a tab writes, so tabs running different app versions
cannot keep rewriting each other's value. MUI persists and synchronizes theme
mode separately.

Stores are module singletons that start working when first imported, so they
need no provider and their loading starts before React renders. The cost is that
a store outlives a test, so tests reset the state behind it. The shared [test
setup](../src/shared/testing/setup.ts) clears localStorage and calls
`reloadPersistedStores` before each test. Tests that touch stored boards call
`resetBoardsDB` from the library's
[`testing`](../src/features/library/testing/index.ts) entry, which empties
IndexedDB and refreshes the board-sets store.

## Module boundaries and code map

Cross-boundary imports use path aliases. Oxlint enforces these dependency rules
for aliased imports:

- `src/shared/` is the leaf layer and does not import from app or features.
- Each directory directly under `src/features/` is a feature. It imports shared
  code, its own relative modules, and the public entry points of the features
  it is allowed to depend on, but never app or another feature's
  internals.
- `src/app/` composes features through public entry points such as
  [`src/features/board/index.ts`](../src/features/board/index.ts).
- Only the library's [`storage/`](../src/features/library/storage/) and its
  [test database helper](../src/features/library/testing/db.ts) import `idb` or
  use the `indexedDB` global, so every other module reaches stored boards
  through the library's public entry point.
- Only the board's [`suggestions/`](../src/features/board/suggestions/) and the
  library's [`translation/`](../src/features/library/translation/) import the
  built-in AI package, so nothing else can come to depend on a model.

There are two features, and the dependency runs one way: the board imports the
library's public entry point, and the library imports no feature.

| Feature                               | Owns                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| [`board`](../src/features/board/)     | Using a board: grid, tiles, message, suggestions, activation, playback, scanning |
| [`library`](../src/features/library/) | Stored board sets                                                                |

Test files may also import the library's
[`testing`](../src/features/library/testing/index.ts) entry.

The library owns the runtime `Board` types, in
[`board-types.ts`](../src/features/library/board-types.ts), because it builds
them from imported files; the board reads them through the public entry point.
The library also owns the URL scheme, in
[`board-paths.ts`](../src/features/library/board-paths.ts), which says why.

Inside a feature, folders group related code and collaborate through relative
imports; they are not separate boundaries. The library's folders still depend
in one direction, so a folder's name tells which layer it is in:

1. `storage/` and `obf/` import no other library folder.
2. `board-sets/` keeps the reactive list of stored sets and reads their boards,
   and the translations they already have, through `storage/` and `obf/`.
3. `import/`, `export/`, and `translation/` build on those.
4. `catalog/` downloads through `import/`.
5. `panel/` is the library's UI and may use all of the above.

### Features

Start with `communication-board.tsx` to follow the board UI. Paths in this table
are relative to `src/features/`.

| Area                   | Source                                                                                           | Responsibility                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Board interaction      | [board/communication-board.tsx](../src/features/board/communication-board.tsx)                   | Compose the board UI and interaction adapters.                                                        |
| Board playback         | [board/playback/](../src/features/board/playback/)                                               | Plan board playback and highlighting; delegate device output to shared code.                          |
| Switch scanning        | [board/scanning/](../src/features/board/scanning/)                                               | Scan the board's controls with one or two switches; own scanning preferences.                         |
| Suggestions            | [board/suggestions/](../src/features/board/suggestions/)                                         | Enable suggestion models and apply rewrite instructions to the message.                               |
| Import and OBF mapping | [library/import/](../src/features/library/import/), [library/obf/](../src/features/library/obf/) | Unify imports and map OBF records to runtime types.                                                   |
| Export                 | [library/export/](../src/features/library/export/)                                               | Package a stored board set as an OBZ file.                                                            |
| Board persistence      | [library/storage/](../src/features/library/storage/)                                             | Own all production IndexedDB access.                                                                  |
| Stored board sets      | [library/board-sets/](../src/features/library/board-sets/)                                       | Maintain the reactive library and read stored boards as runtime types, in the communication language. |
| Bundled catalog        | [library/catalog/](../src/features/library/catalog/)                                             | List the bundled board sets and track their downloads.                                                |
| Library panel          | [library/panel/](../src/features/library/panel/)                                                 | Show stored and downloadable board sets with their info, export, and delete actions.                  |
| Board translation      | [library/translation/](../src/features/library/translation/)                                     | Translate board sets that lack the communication language.                                            |

### App and shared code

Paths in this table are relative to `src/`.

| Area                   | Source                                                                                                                                                 | Responsibility                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| App composition        | [main.tsx](../src/main.tsx), [app/](../src/app/), [shared/providers/](../src/shared/providers/)                                                        | Assemble providers, shell, routing, and features.         |
| Device output          | [shared/playback/](../src/shared/playback/)                                                                                                            | Own all Web Speech and HTML Audio output.                 |
| Communication language | [shared/language/](../src/shared/language/), [shared/speech/](../src/shared/speech/)                                                                   | Coordinate communication language and voice selection.    |
| Theme and direction    | [shared/theme/](../src/shared/theme/)                                                                                                                  | Apply theme and directional styling.                      |
| Shared stores          | [shared/stores/external-store.ts](../src/shared/stores/external-store.ts), [shared/stores/persisted-store.ts](../src/shared/stores/persisted-store.ts) | Provide subscription and settings persistence primitives. |

At the repository root, [messages/](../messages/) holds UI catalogs and
[project.inlang/](../project.inlang/) configures Paraglide, which compiles them into
generated `src/paraglide/` modules.

### Companion packages

The app delegates OBF/OBZ parsing to
[`@shayc/open-board-format`](https://github.com/shayc/open-board-format) and browser
AI availability, provisioning, and session lifecycle to
[`@shayc/react-built-in-ai`](https://github.com/shayc/react-built-in-ai).

### Settings composition

The [settings drawer](../src/app/settings/settings-drawer.tsx) composes
[tile settings](../src/features/board/tile/tile-settings.tsx),
[message settings](../src/features/board/message/message-settings.tsx),
[suggestion settings](../src/features/board/suggestions/suggestion-settings.tsx), and
[scanning settings](../src/features/board/scanning/scanning-settings.tsx)
through feature public entry points. The app owns headings, order, layout, and
drawer behavior; features own controls, capability checks, and persisted
preferences. App-wide language, theme, and speech settings live in `app/settings/`;
language settings render the library's
[board translation notice](../src/features/library/translation/board-translation-notice.tsx)
instead of checking translation progress themselves.
Reusable field controls live in `shared/ui/` so features do not depend on the
app layer.

Closing or unmounting settings does not delete preferences. Removing a feature
requires an explicit decision about retaining or deleting its persisted
preferences.

## Core flows

### Start at `/`

At `/`, a board URL supplied through `?board=` takes precedence: the app names
the link's host and imports only after the user confirms, because `/` opens the
newest board set and a link alone must not change it. URL downloads follow no
redirects, so the named host is the only one the app contacts.
Links must use `https:` unless they point at the app's own origin, because the
Content Security Policy allows no other connections; an `http:` link fails
before the confirmation instead of after it.
Otherwise, the app opens the newest stored board set, or imports the bundled
starter board set if the library is empty.

### Import board files

File selection, drag and drop, URL imports, and PWA file handling all use
`importBoardFile`. Each imported file creates a separate board set. The three
local-file entry points go through `useImportBoardFiles().importAndOpen`, which
opens the board set when exactly one imports. It skips files without a board
file extension and names them only when no board file was given. It imports the
rest one at a time, so a failing file, or a launched file that can't be read,
doesn't block the others. It reports the outcome in one message that names the
file when exactly one fails.

### Export a board set

Export is the reverse, for one set at a time from its library menu.
`boardSetToOBZ` packages the stored OBF records, which already carry the
translations saved on this device, with the set's stored assets:

- `createOBZ` points board links at the boards it packages.
- Media take the normalized path their file is stored under.
- Media whose file was never stored drop their path and fall back to `data` or
  `url`.

The set name, translated into the communication language, names the file.

### Open a board

Route loaders only read; they never translate or wait on a model:

1. Navigation to `/sets/:boardSetId/boards/:boardId` runs
   [`boardSetLoader`](../src/app/routing/board-set/board-set-loader.ts) for the
   header's board list and the set's root board, which Home navigates to
   (once per set, not per board), and
   [`boardLoader`](../src/app/routing/board-set/board-loader.ts), which calls
   `loadStoredBoard`. It reads the stored OBF, resolves object URLs for its
   stored assets, and maps both through `obfToBoard`. Loading leaves the OBF
   unchanged. Media paths resolve only to stored assets; otherwise the item's
   `data` or `url` is used. A link to a board the set does not store is left
   out of the loaded board, so its tile is an ordinary tile.
2. The page renders the board in the communication language through
   `useBoardInLanguage`: the source board, or the board's own translations for
   that language, from the board file or saved on this device. The hook also
   names the language the board ended up in: the board file's own when it has
   no translation, and unknown when the file declares none.

Stored assets are immutable, so
[each asset has one object URL](../src/features/library/storage/asset-urls.ts) for
as long as its board set exists. Message parts keep their media after leaving
the board they came from. A library refresh revokes the URLs of deleted board
sets.

### Translate board sets

[`useTranslateBoardSets`](../src/features/library/translation/use-translate-board-sets.ts)
runs in the app shell on start, on a language change, and when sets are added
or removed. Only a language change aborts the pass in progress; an added or
removed set queues another pass behind it, so a model download started by the
language change's user gesture is never cancelled. Each pass starts with the
set on screen, so that set never waits behind the rest.

For each set not yet in the communication language, it translates the set name
and every board missing that language, then saves them in one transaction.
Boards are checked one by one, because a set's language is only its root
board's. The set name comes from the root board's own translations when the
board file has them, so a set whose file ships every translation is named even
without the Translator API. A saved set name therefore marks the whole set as
translated, so later runs skip it without reading its boards. A set deleted
mid-translation is not written back.

After each saved set, it syncs the library and tells the app shell, which
revalidates the routes (board and board list) when that set is on screen or
being navigated to, so everything on screen updates without a reload. Other
sets are not revalidated: that would re-run a `?board=` link import still in
flight. The library knows nothing about route loaders; the app owns that
decision in
[`useRevalidateBoardSet`](../src/app/routing/use-revalidate-board-set.ts). A set the
translator fails on, for example because a model download needs a user
gesture, stays in its source language until the next run. A storage or other
error ends the pass and is reported, and passes queued behind it still run.

The hook hands each pass to the
[board translation coordinator](../src/features/library/translation/board-translation-coordinator.ts),
which owns the queue, the abort on a language change, and the board translation
status published while a pass is translating a set. The
[board translation notice](../src/features/library/translation/board-translation-notice.tsx)
shows that status, a model download first and the translation after it, in one
alert. Without the Translator API the notice stays hidden: a set the browser
cannot translate shows in its own language, which the user can already see and
cannot change.

### Activate a tile

[`activateButton`](../src/features/board/activation/button-activator.ts)
coordinates navigation and playback, and hands message edits to
[`useMessage`](../src/features/board/message/use-message.ts), the one owner of
how the message changes:

1. A tile linking to another board navigates immediately. A tile without actions
   appends a message part and plays it. Other tiles apply their actions in order.
   The [glossary](#glossary) says how spelling, a space, and backspace change a
   message part.
2. A play action (OBF `:speak`) captures the message at that point. Changes
   from later actions, such as clearing the message, apply only if playback
   finishes uninterrupted and the message was not edited meanwhile, so a clear
   never takes letters typed during the speech with it. The played message
   stays visible during playback and is preserved if playback is interrupted.
3. Once the whole message plays to its end, from the play button, the keyboard
   shortcut, or a tile that only plays it, the next tile or letter starts a new
   message. Editing the message, or replaying it without letting it finish,
   keeps adding to it. A tile that spells and then plays echoes the word and
   does not count. A message setting turns this off.
4. The board playback adapter calls `planPlayback` to turn message parts into
   speech and recorded-audio steps. The shared coordinator plays them in order
   and publishes progress for highlighting. A recorded-audio step carries the
   tile's spoken text, and the coordinator speaks it in place of a recording
   that cannot play, so a broken or unreachable recording does not silence a
   tile that has text to speak.

Each new playback request interrupts the current one. These interruptions are
expected and do not surface as user errors.

The shared coordinator resolves each request as completed, interrupted, or
failed. The board playback adapter is the only place that reads that outcome:
it reports a failure once in an error snackbar, including when only some steps
failed, and tells its callers only whether a message played to its end. A
recording spoken from its text instead is not a failure: the words were heard,
so the step counts as played and nothing is reported.

### Suggest a message

The board renders
[`MessageSuggestions`](../src/features/board/suggestions/message-suggestions.tsx)
under the message bar, inside an error boundary with no fallback, so a failure
in suggestions removes the suggestion bar and nothing else. The bar is also
absent when the browser has no usable suggestion model for the communication
language.

1. [`useMessageSuggestions`](../src/features/board/suggestions/use-message-suggestions.ts)
   gives the message text to three sources: the Proofreader, and the Rewriter
   in two tones. Each source asks only when its model is ready and the message
   has text, and offers one candidate. The Rewriter is told that the text is
   words an AAC user tapped, followed by the user's own suggestion
   instructions from settings.
2. Every change to the message aborts the requests in flight and starts new
   ones, and a result that arrives late is dropped, so a suggestion always
   belongs to the message on screen.
3. [`selectSuggestionPhrases`](../src/features/board/suggestions/select-suggestion-phrases.ts)
   keeps the candidates worth showing, in source order. It drops one that
   repeats the message or an earlier candidate, ignoring case, a final full
   stop, and apostrophe style, and one that carries model artifacts such as an
   underscored word or a quotation mark.
4. [`deriveSuggestionStatus`](../src/features/board/suggestions/derive-suggestion-status.ts)
   reduces the sources to one status for the bar. A model that still needs
   downloading, or that failed to prepare, shows an enable button; pressing it
   is the user gesture a model download needs. A download shows its progress.
   A failure shows only when the message has text, no phrase came back, and
   every usable source failed.
5. Selecting a phrase calls `replaceWithText` on `useMessage`, which replaces
   the message with one text part per word in the communication language. It
   is one step in the undo history, so undo brings the tapped message back.

The message changes only when a phrase is selected, and selecting a phrase
does not speak it. The
phrases are a labelled group, not a live region, because an announcement would
interrupt the spoken feedback of the tile just pressed. The suggestion row is a
scan group, so switch users can select a phrase.

[Suggestion settings](../src/features/board/suggestions/suggestion-settings.tsx)
probe the same models for the communication language. They show the
instructions field when the Rewriter supports that language, and otherwise say
what is missing: the Rewriter, the language, or a device that can run the
models.

## Accessibility, language, and presentation

### Accessibility

Controls have programmatic names and support pointer, keyboard, and switch
input. The
[board grid](../src/features/board/grid/grid.tsx) and its
[keyboard behavior](../src/features/board/grid/use-grid-focus.ts) preserve
these rules:

- A populated grid has one Tab stop, at the remembered tile or first occupied
  cell.
- Arrow keys move between focusable cells; horizontal movement follows text
  direction.
- Home and End move to the first or last focusable cell in the row; with Ctrl
  or Cmd, in the grid.
- When grid content changes, focus returns to the remembered cell or first
  focusable tile only if no other control holds focus.

While focus is anywhere in the board, [shortcuts](../src/features/board/shortcuts/)
remove the last word, clear the message, undo the last change to it, speak it,
and stop speech without moving to a control;
[`resolve-board-shortcut.ts`](../src/features/board/shortcuts/resolve-board-shortcut.ts)
maps the keys. Backspace, play and stop name their shortcuts in a tooltip on
keyboard focus only, since head-pointer and eye-gaze users rest on targets to
select them. Each control's `aria-keyshortcuts` lists the keys that activate it,
and the backspace hint names the clear shortcut for screen readers.

Undo steps back through a bounded history of changes to the message. There is
no redo, and nothing in the interface names undo yet.

### Switch scanning

People who cannot tap or use a keyboard select with one or two switches, which
arrive as the Space and Enter keys. Scanning is off until turned on in settings.
[`scanning/`](../src/features/board/scanning/) holds all of it:

- A scan group is any element spread with `scanGroupProps`; its items are the
  enabled buttons inside it. The board marks the message bar, its controls, and
  each grid row; the grid itself knows nothing about scanning and spreads the
  row props the board hands it. The
  [scanner](../src/features/board/scanning/switch-scanner.tsx) reads the groups
  from the DOM at every step, in document order, highlights the current group
  or item with an attribute, and clicks the selected one. The buttons being
  scanned therefore need no scanning code, and disabled controls and empty
  groups drop out by themselves.
- [`scan-sequence.ts`](../src/features/board/scanning/scan-sequence.ts) is the
  pure state machine that moves through the groups and, inside a selected
  group, its items. Positions hold targets rather than indexes, so the board
  may change between steps. After a group's last item the whole group is
  highlighted once more as an exit step, so a group selected by accident can
  be left.
- Automatic scanning moves on a timer and either switch selects. Two-switch
  step scanning moves with Space and selects with Enter.
- Switch keys count wherever focus is, including on a header button, and are
  kept from the focused control. While scanning is on, Space and Enter
  therefore do not activate focused controls outside dialogs. Keys typed into a
  text field are left alone, and so are keys pressed while a dialog, drawer, or
  menu covers the board.
- While a scan highlight shows, other controls hide their keyboard focus ring so
  only one control looks selected.

The app header, drawers, and dialogs are not scanned; they are for the person
setting up the device.

### Language and direction

The communication language setting coordinates UI locale, board translation,
text direction, and text-to-speech (TTS) voice selection. Language choices combine
UI locales and available voice languages. UI text, board translation, and speech
fall back independently, so selecting a language does not guarantee a matching
voice or translation model.

Speech follows the text, not the setting. Each message part records the
language its text is in: the language the board is shown in for a tile or a
spelled word, and the communication language for a suggestion. Planning a
playback gives every speech step a language, the communication language where
a part's own is unknown, and speaks each run of parts that share one as a
single utterance, so a board the browser could not translate is still read by
a voice of its own language. Speech uses the saved voice only when it speaks
the step's language; otherwise it picks one of that language's voices, or
leaves the choice to the browser, without changing the saved voice.

Paraglide message catalogs provide UI text. The document's `lang` and `dir`
follow the UI locale, so a communication language without a catalog keeps both
on the fallback locale its UI text is shown in. The communication board sets its
own `dir` from the communication language, so a right-to-left language without
a catalog still gets a right-to-left board under a left-to-right app shell.
Tiles carry the `lang` of the language the board is shown in, message parts
carry their own language, and suggestions carry the communication language, so
assistive technology pronounces them correctly whatever the UI locale is. A
board whose file declares no language carries no `lang` and inherits the
document's.

The app and board each use
[`DirectionalThemeProvider`](../src/shared/theme/directional-theme-provider.tsx)
for their own text direction; it switches the Emotion cache and theme to match.

### Theming

The palette and component styles live in
[`theme.ts`](../src/shared/theme/theme.ts).
[`theme-colors.ts`](../src/shared/theme/theme-colors.ts) holds only the page
background colors, which `index.html`, the PWA manifest, and the `theme-color`
meta tag share with the theme. Theme mode is set before the first paint to avoid
a flash of the wrong color scheme.

### Screen sizes

Layout turns on one width breakpoint, `sm`. Above it the play button sits
after the message bar, and backspace sits inside the bar at its end. Below it
the back, home, and play buttons move under the grid, backspace stays in the
message bar, and the spacing tightens, as [Board spacing](#board-spacing)
describes.

The [welcome dialog](../src/app/onboarding/onboarding-dialog.tsx) also checks
the viewport height. On a landscape screen shorter than the `sm` value, such
as a phone on its side, it stays full-screen with its action in view.

Sizes inside a component follow the component, not the screen. The grid's
viewport is a size container that decides how many rows and columns fit. Each
tile is a size container too: a label beside a symbol takes 12% of the shorter
side of the tile's content box, the space inside its padding and border,
between the `body2` and `h6` sizes. The shorter side decides, so a wide but
short tile keeps a small label and leaves its height to the symbol. A label
with no symbol keeps the `h5` size on every tile.

### Board spacing

The board places its bars, and the grid pads itself, with the spacing in
[`board-spacing.ts`](../src/features/board/board-spacing.ts), so the space
between any two of them changes in one place. Two values exist for each side of
the `sm` breakpoint: the page margin and the scroll clearance. The grid's
padding is derived from them in the same file, so the grid itself knows nothing
about the bars around it.

- The bars above the grid sit one page margin apart. The board keeps the scroll
  clearance above and below the grid at every size, whether a bar or the
  screen's edge is next to it. The grid pads its top and bottom by the page
  margin minus that clearance, so its first and last rows are one page margin
  from whatever is next to them, the same as its sides.
- The grid's
  [layout](../src/features/board/grid/grid-layout.ts) takes a padding for each
  axis and one overflow hint. Changing a padding does not change the hint.
- The grid's viewport sets its scroll padding to half the inset of an axis that
  scrolls. A row or column at rest, and a tile scrolled in because it took
  focus, sit that far from the edge with the same hint of both neighbors.
- Where the scroll rests at its start or end and a hint shows next to a bar, the
  space between that bar and the nearest whole row is the clearance, the
  overflow hint, and one tile gap. Making one of the three smaller is the only
  way to make that space smaller. Mid-scroll the space is the clearance plus the
  scroll padding, which is smaller wherever the grid's padding is less than a
  gap plus the hint.

## Current limitations

- **Older browsers are not supported.** The app targets the current versions of
  Chrome, Edge, Firefox, and Safari
  ([Baseline Newly available](https://web.dev/baseline)). Tile colors are
  computed in CSS with relative colors and `contrast-color()`, with no fallback.
  A browser without relative colors shows tiles without their colors, and one
  without `contrast-color()` does not pick a label color that contrasts with the
  tile.
- **AI availability varies.** Support depends on browser, hardware, model
  installation, and language.
- **Boards cannot be edited or synced.** There is no editor or cross-device
  sync. Moving boards between devices means exporting each board set as an OBZ
  file and importing it on the other device.
- **Speech may use external services.** Offline availability and privacy depend
  on the selected voice.
- **Remote media has limited offline support.** Cached third-party images may be
  evicted under storage pressure. Third-party audio remains network-dependent
  because the current cache strategy cannot reliably serve range requests using
  opaque cross-origin responses.

## Glossary

- **AAC** — Augmentative and Alternative Communication: tools for people who
  cannot rely on speech.
- **OBF / OBZ** — Open Board Format: a single board (`.obf`, JSON) or a zipped
  board set with assets (`.obz`).
- **Board** — a grid of communication tiles.
- **Board set** — a collection of linked boards with a root board, imported as a
  unit.
- **Root board** — the board a set opens on. Navigation calls going to it Home,
  after the OBF `:home` action, and the interface calls it the main board.
- **Library** — the board sets stored on this device, listed alongside the
  catalog of bundled board sets that can be downloaded.
- **Symbol** — an AAC representation displayed on a tile or in the message bar:
  an image, a written label, or both.
- **Tile** — an interactive board button containing a communication symbol. It
  adds to the message, navigates to a linked board, or runs an action.
- **Button** — the data model behind a tile, named after the OBF button. Code uses
  `BoardButton` for the data and `Tile` for the view.
- **Vocalization** — the text a tile speaks when it differs from its visible label.
- **Board strings** — a board's translatable text: its name and each tile's label
  and vocalization. OBF keeps their translations in `strings`, one map per locale.
- **Message bar** — the area showing selected symbols that form the message to
  speak.
- **Message part** — one item in the message. A tile part comes from a tile,
  with its label and any vocalization, image, or sound, and backspace removes it
  whole. A text part is a word that was spelled or taken from a suggestion, and
  backspace removes one character at a time. Spelling extends the last text part
  until a space or another tile closes the word; the first backspace on a closed
  word reopens it. The message bar marks the open word with a caret.
- **Page margin** — the space between the screen's edges and the board's
  content, and between one bar and the next.
- **Scroll clearance** — the room kept above and below the grid, between the
  tiles scrolling past and a bar's controls or the screen's edge.
- **Overflow hint** — the part of the next row or column that shows past the
  grid's edge, so the user can tell the board scrolls that way.
- **Inset** — the part of the grid's viewport that whole rows or columns leave
  free: padding, plus a tile gap and the overflow hint where the grid scrolls.
- **Built-in AI** — browser-provided on-device Proofreader, Rewriter, and
  Translator APIs used for grammar, tone, and translation.
- **TTS** — text-to-speech through the browser's Web Speech API.

### Terms with more than one meaning

- **Message** — what the user composes from tiles and plays aloud, in
  [`features/board/message/`](../src/features/board/message/). The UI text
  catalogs in [`messages/`](../messages/), which code reads as `m.someKey`, are
  unrelated.
- **Translation** — UI text comes from the Paraglide message catalogs and is
  read through `useTranslate()`. Board translation is separate: it shows board
  strings in the communication language, reading the translations a board
  already has in
  [`board-in-language.ts`](../src/features/library/board-sets/board-in-language.ts)
  and producing missing ones with the Translator API in
  [`translate-board-sets.ts`](../src/features/library/translation/translate-board-sets.ts).
- **Store and storage** — a store is reactive state that components subscribe
  to, held in memory or persisted to localStorage. Storage is IndexedDB, reached
  only through [`library/storage/`](../src/features/library/storage/). The
  [board-sets store](../src/features/library/board-sets/board-sets-store.ts)
  sits on top of storage: `createBoardSet` and `deleteBoardSet` call storage's
  `insertBoardSetRecords` and `deleteBoardSetRecords`, then refresh the store
  and notify other tabs. Storage functions name the records they touch; store
  functions name the board set.
- **Playback** — speaking text or playing recorded audio.
  [`shared/playback/`](../src/shared/playback/) owns device output and progress;
  [`features/board/playback/`](../src/features/board/playback/) turns message
  parts into the steps to play and reports a playback that fails.
- **Navigation** — moving between boards with Back, Home, and the board
  selector, in [`features/board/navigation/`](../src/features/board/navigation/).
  Moving focus between tiles is the grid's
  [keyboard navigation](../src/features/board/grid/grid-key-navigation.ts), and
  matching URLs to pages is [`app/routing/`](../src/app/routing/).

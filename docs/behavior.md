# Behavior

How each flow and interaction works, and why. Read
[architecture.md](architecture.md) first for the shape of the app: its
invariants, data ownership, and module boundaries. Its
[glossary](architecture.md#glossary) defines the terms used here.

- [Core flows](#core-flows)
  - [Start at `/`](#start-at-)
  - [Import board files](#import-board-files)
  - [Export a board set](#export-a-board-set)
  - [Open a board](#open-a-board)
  - [Translate board sets](#translate-board-sets)
  - [Activate a tile](#activate-a-tile)
  - [Suggest a message](#suggest-a-message)
  - [Report failures](#report-failures)
- [Accessibility, language, and presentation](#accessibility-language-and-presentation)
  - [Accessibility](#accessibility)
  - [Switch scanning](#switch-scanning)
  - [Language and direction](#language-and-direction)
  - [Theming](#theming)
  - [Screen sizes](#screen-sizes)
  - [Board spacing](#board-spacing)

## Core flows

### Start at `/`

At `/`, a board URL supplied through `?board=` takes precedence: the app names
the link's host and imports only after the user confirms, because `/` opens the
newest board set and a link alone must not change it. URL downloads follow no
redirects, so the named host is the only one the app contacts.
Links must use `https:` unless they point at the app's own origin, because the
Content Security Policy allows no other connections; an `http:` link fails
before the confirmation instead of after it.
Otherwise, the app opens the newest stored board set, or imports the
catalog's starter board set if the library is empty.

### Import board files

File selection, drag and drop, URL imports, and PWA file handling all use
`importBoardFile`. Each imported file creates a separate board set, described
by its root board:
[`obfToBoardSetMetadata`](../src/features/library/obf/obf-to-board-set-metadata.ts)
reads the set's name, author, description, license, language, and grid size
from it, and storage keeps what it is given. A root board without a name leaves
the set named after its file, or after its ID when the file name is only an
extension. The installed app's manifest sets `launch_handler` to
`focus-existing`, so a launch focuses the window that is already open instead
of starting a second one, and `useLaunchHandler` decides what that window does:
it imports launched board files, follows a launched link such as a `?board=`
link, and stays on the current board when the launch comes from the app's icon.
The three local-file entry points go through `useImportBoardFiles().importAndOpen`, which
opens the board set when exactly one imports. It skips files without a board
file extension and reports them only when no board file was given. It imports
the rest one at a time, so a failing file, or a launched file that can't be
read, doesn't block the others. It reports the outcome in one message: a single
failure gives its reason, and several failures alongside imports give a count.
Import, export, and delete failure messages leave out file and board set names:
the person just picked that file or set, and names the app doesn't control can
be long and unreadable. Two messages do name the set: catalog download results,
because downloads finish in the background, and the delete confirmation,
because it is the last check before an irreversible action.

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

The board route loaders only read; they never translate or wait on a model:

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

The message being composed outlives the page:
[`useMessage`](../src/features/board/message/use-message.ts) saves it on every
change, because a mobile system can end a page in the background without
warning. It uses localStorage rather than sessionStorage, because an installed
app can restart from scratch after time in the background. A stored asset's
object URL ends with the page, so the
[draft](../src/features/board/message/message-draft.ts) keeps the asset's key in
its place and creates the URL again on restore. `boardLoader` restores the
draft alongside the board, so the board opens with it, symbols included, and
no edit can come before it. A message that played to its end is not kept when
the next symbol would replace it, and an object URL with no stored asset behind
it is left out, since it could only come back broken. The undo history is not saved.

While a board is open,
[`useScreenWakeLock`](../src/shared/hooks/use-screen-wake-lock.ts) holds a
screen wake lock, so a device left on the table during a conversation does not
dim and lock. The browser releases the lock whenever the page is hidden, so the
hook asks again each time the page is shown. Where the API is missing or the
browser refuses (low battery, for example), the screen follows the device's
auto-lock setting and nothing is reported. An installed app before iOS 18.4
grants the lock but does not honor it, so the screen locks there too.

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
set on screen, which the app shell names, so that set never waits behind the
rest.

For each set not yet in the communication language, it translates the set name
and every board missing that language, then saves them in one transaction.
Boards are checked one by one, because a set's language is only its root
board's. The set name comes from the root board's own translations when the
board file has them, so a set whose file ships every translation is named even
without the Translator API. A saved set name therefore marks the whole set as
translated, so later runs skip it without reading its boards. A set deleted
mid-translation is not written back.

After each saved set, it syncs the library. When the set's boards gained
translations, it also tells the app shell, which revalidates the routes (board
and board list) when that set is on screen or being navigated to, so everything
on screen updates without a reload. A set that only gained its name, such as
one already in the communication language, has the same boards as before and is
not revalidated. Other sets are not revalidated either: that would re-run a
`?board=` link import still in flight. The library knows nothing about route
loaders; the app owns that decision in
[`useRevalidateBoardSet`](../src/app/routing/board-set/use-revalidate-board-set.ts). A set the
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

[`activateTile`](../src/features/board/tile/tile-activation.ts)
coordinates navigation and playback, and hands message edits to
[`useMessage`](../src/features/board/message/use-message.ts), the one owner of
how the message changes:

1. A tile linking to another board navigates immediately. A tile without actions
   appends a message part and plays it. Other tiles run their supported actions.
   The board keeps unsupported commands and skips them on activation.
   A tile with no label, vocalization, or board link takes its accessible name
   from a single supported command such as `:space` or `:speak`. Spelling tiles
   and tiles with multiple supported actions need an authored name.
   The [glossary](architecture.md#glossary) says how spelling, a space, and backspace change a
   message part.
   With the message setting "Speak symbols when added" off, a tile stays
   silent: it adds its part, and a tile that spells and then plays does not
   echo the word. It still stops any playback, as a played tile would. A tile
   that only plays the message still plays it, and so does the play button.
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
   and publishes progress for highlighting. A recording, or speech for a single
   part, highlights its part throughout. Speech that joins several parts
   highlights each one only when the voice reports a word boundary in it, so
   a voice that reports no word boundaries highlights none of them rather
   than leave the first one highlighted for the whole utterance. A
   recorded-audio step carries the tile's spoken text, and the coordinator
   speaks it in place of a recording that cannot play, so a broken or
   unreachable recording does not silence a tile that has text to speak.

Each new playback request interrupts the current one, and a board that closes
stops its own playback, so a message it was playing is never marked played
after another board has taken over the draft. These interruptions are expected
and do not surface as user errors.

The shared coordinator resolves each request as completed, interrupted, or
failed. The board playback adapter is the only place that reads that outcome:
it reports a failure once in an error snackbar, including when only some steps
failed, and tells its callers only whether a message played to its end. A
recording spoken from its text instead is not a failure: the words were heard,
so the step counts as played and nothing is reported.

Playback knows nothing of the message's state. `useMessage` is given the
adapter's play function, and its `play` runs it and decides from the result
whether the message has played. The play button, the keyboard shortcut, and a
tile that plays the message as it stands all call `play`. An echo calls
`useMessage`'s `echo`, which runs the adapter's play function too and never
counts.

### Suggest a message

The board renders
[`MessageSuggestions`](../src/features/board/suggestions/message-suggestions.tsx)
under the message bar, inside an error boundary that renders nothing, so a
failure in suggestions removes the suggestion bar and nothing else. The bar is also
absent when the browser has no available suggestion model for the communication
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
   every available source failed.
5. Selecting a phrase calls `replaceWithText` on `useMessage`, which replaces
   the message with one text part per word in the communication language. It
   is one step in the undo history, so undo brings the tapped message back.

While a source is still answering, the
[suggestion bar](../src/features/board/suggestions/suggestion-bar.tsx) shows a
three bare dots after the phrases, where the next one will land, and each
phrase fades in as it arrives. The dots have no fill or outline, so they never
read as one more chip to tap. They wait a little longer than a first phrase
usually takes before they fade in, so quick answers never flash them. They
wait again whenever the first phrase arrives or the phrases clear, since
either moves them along the row. The dots pulse in opacity only, so nothing
beside the grid moves, and hold still when the system asks for reduced motion.
They leave at once when the last source answers.

The message changes only when a phrase is selected, and selecting a phrase
does not play it. The phrases are a labelled group, not a live region, because
an announcement would interrupt the spoken feedback of the tile just pressed.
The suggestion row is a scan group, so switch users can select a phrase.

[Suggestion settings](../src/features/board/suggestions/suggestion-settings.tsx)
probe the same models for the communication language. They show the
instructions field when the Rewriter supports that language, and otherwise say
what is missing: the Rewriter, the language, or a device that can run the
models.

### Report failures

A message on screen names what failed, never why, so the error behind it is
also passed to `reportError`, which shows its cause in the browser console.
Nothing leaves the device. That holds for an ordinary cause too, such as a
download tried offline or a board link the app does not support: the message
gives no reason either way. The code that catches an error and stops it from
travelling further is the code that reports it, which is why the reports below
sit in loaders, stores, hooks and components alike.

- **Routes:** [`reportRouteError`](../src/app/routing/errors/route-error.ts) reports
  loader, action and render errors that reach the error page, except the ones
  the page explains with its own title: board not found and board set not
  found.
- **Board links:** a `?board=` link that can't be parsed or imported is
  explained by the page too, but its title gives no cause, so the loader and
  the action report the underlying error themselves, through
  [`failBoardFileURLImport`](../src/app/routing/root/fail-board-file-url-import.ts).
- **Library:** a failed list load, catalog download, export or delete is
  reported beside its message.
- **Stored pictures and sounds:** a board opens, and a message draft is
  restored, without the assets that can't be read. Each reports its failed
  reads together as one error. An asset that was never stored is not a failure.
- **Translation:** a failed pass is reported, as described in
  [Translate board sets](#translate-board-sets).

Three things are not reported. Cancelled downloads and interrupted navigations
are not failures. An error the screen already explains in full, such as board
not found, has nothing to add. Playback, preferences, saving the message draft
and the built-in AI fail as a matter of course on many devices and handle that
themselves.

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

The header's
[board selector](../src/features/board/navigation/board-selector.tsx) is the
page heading: a button showing the current board's name. It opens a popup with
a search field fixed above the set's boards, which scroll beneath it with the
current board selected and marked with a check. The search field starts empty
and takes focus on open only on a device with a mouse, so a touch screen does
not raise its keyboard over the list. Choosing a board or pressing Escape closes
the popup and returns focus to the heading.

Undo steps back through a bounded history of changes to the message. There is
no redo, and nothing in the interface names undo yet.

### Switch scanning

People who cannot tap or use a keyboard select with one or two switches, which
arrive as the Space and Enter keys. Scanning is off until turned on in settings.
[`scanning/`](../src/features/board/scanning/) holds all of it:

- A scan group is any element spread with `scanGroupProps`; its items are the
  enabled buttons inside it. The board marks the message bar's row, the
  suggestion row, the controls under the grid, and each grid row; the grid
  itself knows nothing about scanning and spreads the row props the board
  hands it. The
  [scanner](../src/features/board/scanning/switch-scanner.tsx) reads the groups
  from the DOM at every step, in document order, highlights the current group
  or item with an attribute, and clicks the selected one. A highlighted group
  outlines each of its enabled buttons, except a grid row (`scanRowProps`),
  which shows one outline around the whole row. The buttons being
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
a voice of its own language. Each language keeps its own saved voice, so
switching languages and back restores the earlier choice. Speech uses the voice
saved for the step's language; when none is saved or it is unavailable, it
picks one of that language's voices, or leaves the choice to the browser,
without changing any saved voice.

Paraglide message catalogs provide UI text. The document's `lang` and `dir`
follow the UI locale, so a communication language without a catalog keeps both
on the fallback locale its UI text is shown in. The communication board sets its
own `dir` from the communication language, so a right-to-left language without
a catalog still gets a right-to-left board under a left-to-right app shell.
Tiles with authored names carry the `lang` of the language the board is shown
in. Generated command names inherit the document's UI language, as do tiles on
boards whose files declare no language. Message parts carry their own language,
and suggestions carry the communication language.

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

The [message bar](../src/features/board/message/message-bar.tsx) stays light in
dark mode, because imported symbols need a light ground. It is a light grey
there, since white would outshine the board. Backspace and play inside the bar
keep the light scheme's colors. The home button beside it keeps the page's
scheme and the same fill as the phone's home pill, so it reads as one button in
every layout and theme.

### Install screenshots

Chrome shows its richer install dialog when the manifest has a screenshot for
the device's form factor. The two in `public/` are static, so retake both after
a visible change to the header, message bar, suggestions, or tiles, keeping
them the same in everything but size:

- **State:** a fresh origin after onboarding, light theme, English, First Words
  with the tiles "I", "want", "more" in the message bar and the pointer off the
  page.
- **Suggestion:** "I'd like more.", the phrase Chrome's built-in AI gave for
  that message. A browser without built-in AI needs `Proofreader` and `Rewriter`
  stubbed to return it.
- **Narrow:** a 390×844 viewport at scale 2, saved as 780×1688.
- **Wide:** a 1024×640 viewport at scale 1.875, saved as 1920×1200. The dialog
  shrinks it to about 580px wide, and this is the smallest viewport where the
  whole board fits.

`e2e/pwa-manifest.spec.ts` fails when a file's dimensions stop matching its
`sizes` in `vite.config.ts`.

### Screen sizes

Layout turns on one width breakpoint, `sm`. Above it the home button sits in
the message bar's row, before the bar. The round home, backspace, and play
buttons are 80px across. Backspace and play sit inside the bar at its end,
with play last. All three controls use 32px icons in every layout.
Backspace uses the light tonal fill of a filled MUI chip, and play's primary
fill emphasizes the action. The tonal fill stays when backspace is off, and
the hold ring traces its edge. Suggestions
have the row below to themselves, and without them the grid starts under the
message bar. Below `sm`
the home and play buttons move under the grid as two pills of one width, with
home at the start and play at the far end. The row is inset 32px, twice the
page margin, so the thumb reaches both without stretching. Below it is the page
margin or the home indicator's inset, whichever is larger, as in iOS's own bars.
Backspace stays in the message bar at full size, and the spacing tightens, as
[Board spacing](#board-spacing) describes.

One height rule sits beside it, in
[`short-landscape.ts`](../src/shared/theme/short-landscape.ts): a landscape
screen shorter than the `sm` value, such as a phone on its side. Height is
what such a screen lacks, so:

- The controls keep their places from above `sm`, whatever the width.
- The spacing tightens as it does below `sm`.
- The app bar and the drawers' toolbars keep MUI's heights, 64px from the `sm`
  width up: iOS hides the status bar there, so the toolbar's own height is the
  only room above them.
- The message bar drops to a compact height, 64px and its inset, with smaller
  symbols. Home, backspace, and play are all 64px across.
- The [welcome dialog](../src/app/onboarding/onboarding-dialog.tsx) stays
  full-screen with its action in view.

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
the `sm` breakpoint: the page margin and the scroll clearance. A short
landscape screen uses the values from below the breakpoint. The grid's
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

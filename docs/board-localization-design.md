# Board localization decision

The active board and board selector consume one localized result from the board
route loader. This keeps names consistent across the page title, grid, and
selector without a second storage snapshot or translation store. The runtime
contract is documented in [Architecture](architecture.md#open-a-board).

## Why the loader owns the result

Previously, the loader translated the active board while the selector read its
own stored records. Language changes could leave the selector showing old names,
and unvisited board names never received missing translations. Refreshing that
storage read alone could still race with translation cache writes.

The loader now reads the board set's source records once and hydrates media only
for the active board. The resolver returns the localized board, board summaries,
and source languages needed to prepare translation models. The page and header
consume this result through the app composition boundary. Cache writes preserve
successful translations for later loads without delaying the current view.

See the [loader](../src/app/routing/loaders/board-loader.ts),
[resolver](../src/features/board/translation/resolve-board-for-language.ts), and
[selector](../src/features/board/navigation/board-selector.tsx).

## Phrase resolution and fallback

Names, tile labels, and vocalizations use the same phrase resolution policy.
Source dictionary tokens resolve to wording before translation, while cache
entries retain their original keys. Existing translations win; missing entries
can be generated independently, so a cached board name does not imply that the
board's tiles are translated. Concurrent cache writes merge missing entries and
reject results whose source content has changed.

Each resolved text field carries its own language. A partial translation can
therefore retain source wording without marking it as the requested language.
Unknown source languages remain unknown, and unnamed boards use their identifiers
without sending those identifiers for translation. The selector's accessible
label uses the UI catalog's language independently of the selected board name.

## Tradeoffs

Optional translation runs within a shared one-second limit, prioritizing active
board content and retaining completed phrases when other work fails or times out.
The loader uses prepared models. Selecting a language starts missing model
preparation through
[`prepareBoardTranslationModels`](../src/features/board/translation/prepare-board-translation-models.ts);
success revalidates the current board even after settings close.

This design adds a bounded translation wait to navigation. A reactive translation
overlay could render source content before inference completes, but would need a
new shared owner and rules for progressive updates. Whole-set translation could
support advance preparation for offline use, but would need progress and retry
controls. Neither is required for consistent board names.

The one-second limit is provisional. Real model quality, download latency,
large-set coverage, and screen-reader pronunciation still need device testing.
Existing browser coverage exercises
[language changes and model preparation](../src/app/routing/board-localization.test.tsx),
[selector interaction and language labels](../src/features/board/navigation/board-selector.test.tsx),
[phrase fallback and cancellation](../src/features/board/translation/resolve-board-for-language.test.ts),
and [cache merging](../src/features/board/storage/board-content-storage.test.ts).

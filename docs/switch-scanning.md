# Switch scanning: research and MVP design

Status: phase 1 (the MVP) is implemented; phases 2 and 3 are proposals.

This document collects what established AAC software and the research
literature agree on about switch scanning, fixes the vocabulary the app will
use, and scopes a minimal first release (the MVP) plus later phases. It is the
design input for the implementation PRs, not user documentation.

- [Why in-app scanning](#why-in-app-scanning)
- [Evidence summary](#evidence-summary)
- [Vocabulary](#vocabulary)
- [Feature survey](#feature-survey)
- [MVP scope](#mvp-scope)
- [UX design](#ux-design)
- [Code design](#code-design)
- [DX and testing](#dx-and-testing)
- [Phased roadmap](#phased-roadmap)
- [Open questions](#open-questions)
- [Sources](#sources)

## Why in-app scanning

People who cannot reliably touch a screen use one or two **switches** (large
buttons pressed with a hand, head, knee, or other reliable body site). A
**switch interface** connects the switch to the device and, in its keyboard
mode, sends ordinary key presses — by default **Space** and **Enter** on the
most common Bluetooth interface (AbleNet Blue2 FT; it can also send 1–4).

Operating-system scanning (iOS Switch Control, Android Switch Access) already
works with the app, because tiles and controls are standard buttons. Every major
dedicated AAC app nonetheless ships its own in-app scanning (Proloquo2Go, TD
Snap, TouchChat/LAMP WFL, Grid 3, Cboard, Asterics AAC), because OS scanning
knows nothing about the board: it scans browser chrome, cannot group by board
row, and cannot be tuned per communicator. macOS (Switch Control) and ChromeOS
(Switch Access) have the same limits, and Windows has no built-in switch
scanning at all, so on Windows in-app scanning is the only option without
third-party software.

In-app scanning must therefore be **off by default and invisible when off**, so
OS-level switch users keep the behavior they rely on today.

## Evidence summary

The research base is small and mostly single-subject or small-group studies;
practice guidance comes largely from clinicians and vendors. The points below
are the ones consistent across sources and are what the design leans on.

1. **Speed, pattern, and selection method must be individualized** to the
   person's physical, visual, and cognitive abilities (Beukelman & Mirenda,
   via Wikipedia). → Every timing value is a setting, not a constant.
2. **Timing is a major lever.** In single-switch text entry, Koester & Simpson
   found scan delay among the most important parameters, alongside word
   prediction and layout, and setting it from the user's measured reaction
   time produced large gains; the Scanning Wizard evaluation reached the same
   conclusion. These studies used keyboards, not symbol boards, but the timing
   trade-off carries over: a delay that is too short causes errors and
   corrections, and one that is too long wastes time on every step. → Scan time
   has a wide, fine-grained range and a first-item delay.
3. **Scanning is slow and error-prone for children**, because of its cognitive
   and motor demands. Petersen, Reichle & Johnston (2000): preschoolers'
   overall errors did not differ significantly between linear and row-column
   scanning, but errors rose with the number of cursor movements and passes
   needed to reach the target. → Offer both patterns; keep passes bounded.
4. **Step scanning removes timing demands** but needs more presses and two
   switches; automatic scanning needs one switch but demands timing (Closing
   the Gap, 2023; Wikipedia). → Offer both; neither is universally better.
5. **Interaction errors are frustrating for switch users** (a study of
   physiological responses to errors in children with cerebral palsy), and
   accidental repeated presses are one source that every major platform and
   most vendors filter ("ignore repeated presses", "debounce", "release
   time"). The prevalence evidence is that vendor consensus, not a study. →
   Ship repeat-press filtering in the MVP.
6. **Auditory scanning** (speaking each item as it is highlighted) is standard
   practice for people with visual impairment, including cortical visual
   impairment, but has no controlled efficacy trials. → Planned, not MVP.

## Vocabulary

Rule: use the term most of the surveyed products use for the same concept, and
never coin a new one. Where products split, prefer the platform term (Android
and Apple) because caregivers and clinicians meet it first.

| Concept                            | App term (UI)               | Code name          | Others call it                                                                                                                                       |
| ---------------------------------- | --------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| The feature                        | Switch scanning             | `scanning`         | Scanning access method (TD Snap, P2G, PRC); Switch Control (Apple); Switch Access (Android); Scanning (Grid 3, Cboard, Asterics)                     |
| Physical input                     | Switch                      | `SwitchRole`       | Universal                                                                                                                                            |
| Indicator on the current target    | Highlight                   | `highlight`        | Scanning highlight (Android); Highlighting (Grid 3, TD Snap); cursor (Apple); scanning indicator (literature)                                        |
| One switch, timer advances         | Auto scan                   | `"auto"`           | Auto-scan (Android); Auto Scanning (Apple); 1 Switch Autoscan (TD Snap); Automatic Scanning (P2G); Automatic (Cboard)                                |
| Switch advances, switch selects    | Step scan                   | `"step"`           | Step scanning (Android, P2G, literature); 2 Switch Step Scan (TD Snap); Manual Scanning (Apple); Manual (Cboard)                                     |
| Switch that picks the highlight    | Select                      | `"select"`         | Select (Android); Select Item (Apple); Selector (TD Snap); Picker (P2G)                                                                              |
| Switch that moves the highlight    | Next                        | `"next"`           | Next (Android); Move to Next Item (Apple); Stepper (TD Snap, P2G)                                                                                    |
| One item at a time                 | Linear                      | `"linear"`         | Linear scanning (Android, P2G, TD Snap, literature); Scan cells one at a time (Grid 3)                                                               |
| Rows, then items in the row        | Row-column                  | `"row-column"`     | Row-column (Android, literature); Row/Column (P2G, TD Snap); Scan rows/columns, then cells (Grid 3)                                                  |
| A set scanned as one step          | Group                       | `group`            | Scan group (TD Snap); group (Apple, Android, literature); block (Grid 3)                                                                             |
| Seconds each highlight stays       | Scan time                   | `scanTime`         | Auto-scan time (Android); Auto Scanning Time (Apple); Scan Speed (PRC); scan rate (literature); Time delay (Cboard)                                  |
| Extra time on a group's first item | Delay on first item         | `firstItemDelay`   | Delay on first item (Android); Pause on First Item (Apple); pause on the first item (Grid 3, label unverified); Time factor first element (Asterics) |
| Passes before stopping             | Number of scans             | `scanCount`        | Number of scans (Android); Loops (Apple); Maximum number of scans (Grid 3); Scanning rounds until going back (Asterics)                              |
| Debounce after a press             | Ignore repeated presses     | `repeatPressDelay` | Ignore repeated presses, formerly Debounce time (Android); Ignore Repeat (Apple); Ignore repeat presses (Grid 3); Release Time (PRC)                 |
| Spoken item names while scanning   | Auditory cues (later phase) | `auditoryCues`     | Auditory Cues (P2G); Audio Feedback / auditory cue (TD Snap); Speak description when highlighting (Grid 3); Spoken feedback (Android)                |

Decisions behind the less obvious rows:

- **"Scan time", not "scan speed".** Speed reads as "higher is faster", but every
  product that shows a number shows seconds per item, where higher is slower.
  Android and Apple both name the seconds value a _time_.
- **"Step scan", not "manual scanning".** "Manual" is Apple- and Cboard-only;
  "step" is the term in the literature, Android, TD Snap, and Proloquo2Go.
- **"Select" and "Next"**, the Android labels, are plain words that translate
  cleanly; "stepper" and "picker" are vendor jargon.
- **"Highlight"**, not "cursor" or "focus": "focus" already means keyboard focus
  in this codebase and in WCAG, and the two must not be confused.
- Add the app terms above to the [glossary](architecture.md#glossary) in the
  implementation PR.

## Feature survey

Products: Apple Switch Control (iOS), Android Switch Access, Grid 3, Proloquo2Go
(P2G), TD Snap, PRC-Saltillo apps (TouchChat, LAMP WFL), Cboard, Asterics AAC.

✓ = documented, – = not found in the sources read (absence is not proof).
Cboard offers one fixed pattern that its settings don't name, so neither
pattern is marked for it. The PRC and TD Snap columns rest partly on
third-party setup guides, because their own manuals could not be read.

| Feature                                  | Apple | Android | Grid 3 | P2G | TD Snap | PRC | Cboard | Asterics | Count | Phase |
| ---------------------------------------- | ----- | ------- | ------ | --- | ------- | --- | ------ | -------- | ----- | ----- |
| Auto scan (1 switch)                     | ✓     | ✓       | ✓      | ✓   | ✓       | ✓   | ✓      | ✓        | 8     | MVP   |
| Step scan (2 switches)                   | ✓     | ✓       | ✓      | ✓   | ✓       | ✓   | ✓      | ✓        | 8     | MVP   |
| Linear pattern                           | ✓     | ✓       | ✓      | ✓   | ✓       | ✓   | –      | –        | 6     | MVP   |
| Row-column pattern                       | –     | ✓       | ✓      | ✓   | ✓       | ✓   | –      | ✓        | 6     | MVP   |
| Scan time setting                        | ✓     | ✓       | ✓      | –   | ✓       | ✓   | ✓      | ✓        | 7     | MVP   |
| Message bar / toolbar scanned as groups  | –     | –       | ✓      | ✓   | ✓       | –   | –      | –        | 3     | MVP   |
| Number of scans / loops                  | ✓     | ✓       | ✓      | –   | –       | –   | –      | ✓        | 4     | MVP   |
| Delay on first item                      | ✓     | ✓       | ✓      | –   | –       | –   | –      | ✓        | 4     | MVP   |
| Ignore repeated presses                  | ✓     | ✓       | ✓      | –   | –       | ✓   | –      | –        | 4     | MVP   |
| Auditory cues (speak while scanning)     | ✓     | ✓       | ✓      | ✓   | ✓       | ✓   | –      | –        | 6     | 2     |
| Separate cue voice                       | –     | –       | –      | ✓   | ✓       | ✓   | –      | –        | 3     | 2     |
| Highlight style options                  | ✓     | ✓       | ✓      | –   | ✓       | –   | –      | –        | 4     | 2     |
| Assign keys to switches                  | ✓     | ✓       | ✓      | ✓   | ✓       | –   | –      | ✓        | 6     | 2     |
| Screen as switch                         | ✓     | –       | –      | ✓   | –       | –   | –      | ✓        | 3     | 2     |
| Hold duration / acceptance time          | ✓     | –       | ✓      | –   | ✓       | ✓   | –      | ✓        | 5     | 2     |
| Select on release                        | –     | ✓       | ✓      | –   | –       | –   | –      | –        | 2     | 2     |
| Resume at last selection vs. restart     | ✓     | –       | –      | –   | ✓       | ✓   | –      | –        | 3     | 2     |
| Start scanning automatically             | –     | ✓       | –      | –   | –       | –   | ✓      | ✓        | 3     | 2     |
| Finish speech before moving              | –     | ✓       | –      | –   | –       | –   | –      | –        | 1     | 2     |
| Column-row pattern                       | –     | –       | ✓      | –   | ✓       | –   | –      | ✓        | 3     | 3     |
| Groups beyond rows (blocks, scan groups) | ✓     | ✓       | ✓      | –   | ✓       | –   | –      | ✓        | 5     | 3     |
| Reverse direction / Previous switch      | –     | ✓       | ✓      | –   | –       | –   | –      | –        | 2     | 3     |
| Back up one level switch                 | –     | –       | ✓      | –   | –       | –   | –      | –        | 1     | 3     |
| Stop scan switch                         | –     | –       | ✓      | –   | –       | –   | –      | –        | 1     | 3     |
| Inverse scanning (hold to move)          | –     | –       | ✓      | ✓   | –       | –   | –      | –        | 2     | 3     |
| Automatic selecting (select on no press) | –     | –       | –      | ✓   | –       | –   | –      | –        | 1     | –     |
| Point scanning (crosshair)               | ✓     | ✓       | –      | –   | –       | –   | –      | –        | 2     | –     |

Reading the table: the MVP is the set that nearly every product has, plus
toolbar groups, which the board needs for a switch user to speak or delete
without touch. Point scanning is an OS concern for apps without targets and is
out of scope; automatic selecting appears in one product only.

## MVP scope

A switch user can, with one switch (auto scan) or two (step scan), reach every
tile and the message controls on the board, select them, and tune timing.

In scope:

1. Settings: Switch scanning on/off, Scan method (Auto scan, Step scan), Scan
   pattern (Row-column, Linear), Scan time, Delay on first item, Number of
   scans, Ignore repeated presses.
2. Fixed switch keys (no assignment UI yet), matching interface defaults:
   - Auto scan: **Space** or **Enter** = Select.
   - Step scan: **Space** = Next, **Enter** = Select.
   - Only unmodified key presses; held-key auto-repeat (`event.repeat`) is ignored.
3. Scan order is DOM (reading) order on every screen size. On wide screens
   that is Play, the navigation buttons, Backspace, then board rows; on small
   screens the navigation buttons and Backspace follow the rows, where the
   bottom toolbar puts them. Empty cells and disabled buttons are skipped.
4. Row-column: Play, the navigation buttons, Backspace, and each board row are
   groups. Selecting a group scans its targets. A group with one enabled
   target, such as Play, is scanned as that target, and a group with none is
   skipped. Linear: every target is scanned one at a time in the same order.
5. Leaving a group: after a group's last target, the whole group is
   highlighted once more as an exit step (as in Apple Switch Control).
   Selecting it returns to group level. In auto scan, **Number of scans**
   passes through the group without a selection also return to group level.
6. After a selection: restart from the first group (the board may have
   changed).
7. Auto scan only: after **Number of scans** passes at group level without a
   selection, scanning pauses. Step scan never pauses, because nothing moves
   without a press; Next wraps around.
8. A single high-contrast highlight style, distinct from the keyboard focus ring.

Known gap: **clearing the whole message** is a long press on Backspace (or
Cmd/Ctrl+Backspace), which a switch can't perform. Switch users clear with
repeated Backspace in the MVP; a scannable Clear target is in phase 2.

Out of scope for the MVP: everything marked phase 2 or 3 above, scanning the
app header, settings drawer, library, and suggestion bar. Those stay reachable
by touch for caregivers; scanning pauses while a dialog, drawer, or menu is
open.

While scanning is on, unmodified Space and Enter are switches everywhere in
the app except in text fields and open overlays, so they no longer activate a
keyboard-focused button. Tab, arrow keys, and the modified shortcuts
(Cmd/Ctrl+Enter, Cmd/Ctrl+Backspace) keep working.

### Default values

Defaults are starting points a clinician tunes; they favor fewer errors over
speed, per the evidence summary.

| Setting                 | Default    | Range                 | Notes                                                    |
| ----------------------- | ---------- | --------------------- | -------------------------------------------------------- |
| Switch scanning         | Off        | On / Off              | Off keeps OS Switch Control behavior unchanged.          |
| Scan method             | Auto scan  | Auto scan / Step scan | Needs one switch; the default in Apple and Proloquo2Go.  |
| Scan pattern            | Row-column | Row-column / Linear   | Linear needs one step per tile, slow on large boards.    |
| Scan time               | 1.5 s      | 0.25–5 s, 0.25 step   | Auto scan only. Cboard ranges 0.75–5 s; PRC 0.2–10 s.    |
| Delay on first item     | 0.5 s      | 0–3 s, 0.25 step      | Auto scan only; added to scan time, as on Android.       |
| Number of scans         | 3          | 1–5                   | Grid 3 offers up to 5.                                   |
| Ignore repeated presses | Off (0 s)  | 0–2 s, 0.1 step       | Turned on per person; a default would drop real presses. |

## UX design

### Settings

A new settings drawer section, **Switch scanning**, after **Message**. Controls
use the existing `shared/ui` fields:

- `SettingsSwitch` — Switch scanning.
- `SettingsRadioGroup` — Scan method.
- A hint under the method that names the keys for the chosen method: "The
  highlight moves on its own. Press Space or Enter to select." or "Press Space
  to move the highlight and Enter to select." The shared fields have no
  help-text prop today, so this is a plain secondary-text line in
  `ScanningSettings`, not a change to `shared/ui`.
- `SettingsRadioGroup` — Scan pattern.
- `SettingsSlider` — Scan time, Delay on first item, and Ignore repeated
  presses, formatted as seconds with `Intl.NumberFormat` in the UI locale, and
  Number of scans as a plain count.
- With scanning off, only the switch shows. Sliders that apply only to auto
  scan (Scan time, Delay on first item, Number of scans) are hidden in step
  scan, not disabled, so the section stays short.

All strings go through Paraglide in every catalog. Translate "switch" as the
input device, not a toggle — the classic localization trap for this feature;
add a translator note in the PR description.

### On the board

- **Highlight:** a thick two-tone ring (a dark band beside a light band, each
  ≥ 2px) on the group or the single target. Tiles carry arbitrary colors from
  the board file, so no single color can meet 3:1 contrast against all of
  them; a two-tone ring always has one band that does (WCAG technique C40).
  It must look different from the focus-visible ring and must not animate.
- **Scrolling:** the highlighted target is scrolled into view with
  `block: "nearest"` so large boards stay usable.
- **Paused state:** no highlight. The next switch press starts scanning from
  the first group; there is no on-screen "start" button in the MVP because
  touch users don't need it and switch users can't reach it.
- **Overlays:** when a dialog, drawer, or menu opens, scanning pauses and
  ignores keys, so Space and Enter work normally there. Auto scan pauses on
  its next step and, when the overlay closes, stays paused until the next
  switch press, so the highlight never starts moving on its own while a
  caregiver is still handing the device back. Step scan has nothing to pause;
  its highlight stays where it was.
- **Placement:** the ring is a 6px box shadow outside the element. It fits in
  the 8px gaps between rows and tiles and inside the grid's padding, so the
  scrolling grid doesn't clip it, and it leaves the outline free for the
  focus ring. Checked by rendering the starter board in both patterns.
- **Speech:** selecting a tile behaves exactly as tapping it. Scanning keeps
  running during playback (Android's "Finish speech before moving" is phase 2).
- **Screen readers:** in-app scanning is not a screen reader mode and does not
  move DOM focus. Tiles keep their accessible names; nothing new is announced.

## Code design

### Placement

Scanning drives the board UI, so it lives in the board feature:

```
src/features/board/scanning/
  scan-model.ts                 # pure state machine: events → next state
  scan-targets.ts               # DOM query: groups and targets in reading order
  scan-highlight.ts             # highlight style for the board root
  scanning-preferences-store.ts # createPersistedStore + parse
  scanning-settings.tsx         # settings controls, exported from index.ts
  switch-scanner.ts             # timer, key handling, highlight, selection
  use-switch-scanning.ts        # runs the scanner while the preference is on
```

`ScanningSettings` is exported through `src/features/board/index.ts` and
composed by the app's settings drawer, like `TileSettings`.

### Key decisions

1. **Targets come from the DOM, not a registry.** Groups are elements marked
   `data-scan-group` inside the board root; targets are the enabled buttons in
   each group, in DOM order. The grid's existing `role="row"` elements get the
   attribute, as do the message bar, the `NavigationButtons` root, and the
   Backspace button. The row that holds the navigation buttons also holds the
   suggestion bar, so the attribute goes on those children, not on the row.
   This follows the reading order on every breakpoint without a React
   registration API.
2. **Selecting clicks the target.** `target.click()` reuses every existing
   activation path (tile actions, navigation, Backspace, Play) with no new
   wiring, and keeps scanning a pure input method. Backspace listens through
   react-aria's `usePress`, which treats a scripted click as a press; a test
   pins that.
3. **The highlight is a data attribute, not React state.** The hook sets
   `data-scan-highlight` on the current element and clears the previous one;
   one nested rule in the board root's `sx` styles it, so the style stays in
   the feature. Moving the highlight re-renders nothing, which
   preserves the tile render work saved in
   [#1075](https://github.com/shayc/aac-board-ai/pull/1075).
4. **A pure state machine owns scanning logic.** `scan-model.ts` exports
   `nextScanState(state, event, groupSizes, options)` with events `next` (a
   Next press or the auto scan timer) and `select`. The linear pattern needs
   no code of its own: every target becomes a single-target group. State is
   `{ status: "paused" | "groups" | "items", groupIndex, itemIndex, pass }`,
   where `itemIndex` equal to the group's target count is the exit step. It
   returns the next state and, for `select`, which target to activate. The
   single-target, exit-step, pass-counting, and pause rules all live here and
   are unit-testable without timers or DOM.
5. **A plain scanner does the work; the hook only runs it.**
   `startSwitchScanner(root, preferences)` schedules one `setTimeout` per step
   in auto scan, applies the highlight, and dispatches to the model.
   `useSwitchScanning(rootRef, boardId)` starts it while the preference is on
   and restarts it when a preference changes. The scanner claims Space and
   Enter with
   `keydown` and `keyup` listeners on `document` in the capture phase, calling
   both `preventDefault` and `stopPropagation`:
   - `preventDefault` alone is not enough. React delivers events to
     react-aria's `usePress` (Backspace) and `useKeyboard` (grid, board
     shortcuts) whether or not the default was prevented, so propagation must
     stop before the event reaches the React root.
   - Native buttons activate on Space at `keyup`, so `keyup` must be claimed
     too, or one press both selects the highlight and clicks the focused
     button.

   It ignores modified keys, `event.repeat`, presses within the repeat-press
   delay, and editable targets (which covers the board selector's text field).
   It is suspended while an overlay is open, detected as the board root having
   an `aria-hidden="true"` ancestor: MUI's modal manager hides the app root
   that way for every `Drawer`, `Dialog`, `Menu`, and `Select` popup.
   `aria-modal` would miss menus and select popups, which don't set it. When
   scanning is off no scanner exists and nothing is registered.

6. **Targets are read fresh on every step, and the scan follows the
   highlighted element.** The scanner re-queries groups and targets before
   each move and each selection, then finds the highlighted element in them.
   Indexes shift when Play or Backspace turns on or off; following the element
   keeps what is selected equal to what is highlighted. A selection runs
   inside `flushSync`, so React commits the result (the first word enables
   Play) before the scan restarts on the updated board. Board navigation
   additionally resets scanning to the first group, keyed on the board ID.

### Preferences

```ts
interface ScanningPreferences {
  isEnabled: boolean;
  method: "auto" | "step";
  pattern: "row-column" | "linear";
  scanTime: number; // seconds
  firstItemDelay: number; // seconds
  scanCount: number;
  repeatPressDelay: number; // seconds; 0 = off
}
```

Stored under `scanning-preferences` with `createPersistedStore`, parsed with
`parseBoolean`, `parseClampedNumber`, and a literal guard, like
`tile-preferences-store.ts`.

### Board integration

`CommunicationBoard` calls `useSwitchScanning(boardRootRef, board.id)` and
adds `data-scan-group` to the message bar, navigation buttons, and Backspace;
`GridRow` adds it to each row. The theme gains the highlight style, the
settings drawer gains the section, and the feature index exports the settings.
Grid arrow-key navigation is untouched because scanning claims only Space and
Enter.

## DX and testing

Following [AGENTS.md](../AGENTS.md#testing-instructions):

- `scan-model.test.ts` — table-driven tests for both patterns and methods:
  advancing, wrapping, single-target groups, the exit step, pass counting,
  pausing (auto scan only), skipping empty groups, and selection results. No
  DOM, no timers.
- `use-switch-scanning` behavior through `renderCommunicationBoard`: press
  Space/Enter with `userEvent.keyboard` and assert the highlighted element and
  the resulting message. Auto scan uses `vi.useFakeTimers()` to advance time
  deterministically, the case AGENTS.md allows; set up `userEvent` to advance
  the fake timers, or key presses wait forever. Include a test that a focused
  tile is not also clicked when Space selects a different highlighted tile.
- Settings tests render `ScanningSettings`, change each control, and assert the
  persisted value and the hidden auto-only sliders in step scan.
- axe check on the board with a highlight present, in both engines.
- A short "Try it" note in the README: turn on Switch scanning, then use Space
  and Enter as switches. Any keyboard is a valid test switch.

## Phased roadmap

| Phase | Theme                 | Contents                                                                                                                                                                                                                                                                                |
| ----- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | MVP                   | Everything in [MVP scope](#mvp-scope).                                                                                                                                                                                                                                                  |
| 2     | Comfort and feedback  | Auditory cues with a separate cue voice and volume; assign switches (record key, 1–4, mouse); screen as switch; highlight style options; hold duration; select on release; resume vs. restart; start automatically; finish speech before moving; scan the suggestion bar; Clear target. |
| 3     | Efficiency and expert | Column-row; custom groups (OBF has none, so derived, for example by board quadrants); Previous / reverse switch; back up one level; stop scan switch; inverse scanning.                                                                                                                 |

Each phase is one PR, or a few if the diff argues for it. Phase 1 is done.

## Open questions

1. Should the header (board selector, library, settings) ever be scannable? It
   lets a switch user change board sets alone, but also lets them reach
   caregiver settings. Recommendation: not before phase 2, and then behind its
   own setting.
2. Exact vendor defaults (Apple loops, Android scan time) were not confirmed
   from first-party pages and are not relied on; the MVP defaults above stand
   on the evidence summary and the Cboard and PRC ranges.

## Sources

Product documentation:

- Apple, [Use Switch Control to navigate your iPhone, iPad, or iPod touch](https://support.apple.com/en-us/119835)
- Google, [Change Switch Access settings](https://support.google.com/accessibility/android/answer/6301497) and [Set up Switch Access](https://support.google.com/accessibility/android/answer/6301490)
- Smartbox, [Using switch scanning with Grid 3](https://hub.smartboxaac.com/knowledgebase/using-switch-scanning-with-grid-3/)
- AssistiveWare, [Proloquo2Go scanning mode](https://www.assistiveware.com/support/proloquo2go/alternative-access/scanning-mode) and [auditory cues](https://www.assistiveware.com/support/proloquo2go/alternative-access/get-auditory-cues)
- AbleNet, [Setting up in-app switch scanning in TD Snap](https://support.ablenetinc.com/guides/td-snap/setting-up-in-app-switch-scanning-in-td-snap/); Tobii Dynavox, [scan groups in TD Snap](https://us.tobiidynavox.com/blogs/support-articles/how-do-i-create-and-edit-scan-groups-in-snap) and [Scanning Page Set Implementation Guide](https://downloads.tobiidynavox.com/Software/TD_Snap/TobiiDynavox_Snap_Scanning_ImplementationGuide_en-US.pdf) (search excerpts only)
- PRC-Saltillo, [Scan Timing](https://saltillo.com/support/article/Scan-Timing) (read through search excerpts only; the page did not load); AbleNet, [Set up scanning in TouchChat, LAMP, and Unity](https://support.ablenetinc.com/guides/touchchat/set-up-scanning-in-prc-apps/)
- Cboard, [Scanning settings source](https://github.com/cboard-org/cboard/tree/master/src/components/Settings/Scanning)
- Asterics AAC, [Input options](https://github.com/asterics/Asterics-AAC/blob/master/docs/documentation_user/09_input-options.md)
- AbleNet, [Blue2 FT keyboard command mode](https://support.ablenetinc.com/assistive-technology/how-do-i-use-keyboard-command-mode-on-the-blue2-ft/)

Research and practice:

- [Switch access scanning](https://en.wikipedia.org/wiki/Switch_access_scanning), Wikipedia (definitions; cites Beukelman & Mirenda)
- Petersen, Reichle & Johnston (2000), [Examining preschoolers' performance in linear and row-column scanning techniques](https://experts.umn.edu/en/publications/examining-preschoolers-performance-in-linear-and-row-column-scann/), _AAC_ 16, 27–36
- [Effectiveness and usability of Scanning Wizard software](https://pmc.ncbi.nlm.nih.gov/articles/PMC5967995/)
- [Modelling noise-resilient single-switch scanning systems](https://arxiv.org/pdf/1712.10073) (summarizes Koester & Simpson 2014 on scan delay)
- [Autonomic responses to correct outcomes and interaction errors during single-switch scanning](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3975284/)
- [Multi-modal access method (eye tracking + switch scanning)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9576815/) (scanning demands in children)
- Dropik & Reichle (2008), [directed vs. group-item scanning](https://experts.umn.edu/en/publications/comparison-of-accuracy-and-efficiency-of-directed-scanning-and-gr/)
- Closing the Gap, [Solutions, August 2023](https://www.closingthegap.com/media/solutions/issues/202308.pdf) (step vs. automatic scanning in practice)
- The Bridge School, [AAC tools and techniques](https://communication.bridgeschool.org/intervention/aac-system-design-guiding-principles/aac-system-design-examples-of-aac-tools-and-techniques/) (auditory scanning)

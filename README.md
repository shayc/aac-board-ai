# AAC Board AI

[![CI](https://github.com/shayc/aac-board-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shayc/aac-board-ai/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

**Winner — [Google Chrome Built-in AI Challenge 2025](https://developer.chrome.com/blog/ai-challenge-winners-2025) (Most Helpful Application)**

**AAC Board AI** is an Augmentative and Alternative Communication (AAC) board for people who cannot rely on speech. It uses **Built-in AI** for on-device grammar correction, tone adjustment, and translation — keeping interactions private, fast, and reliable offline.

![Demo of AAC Board AI](demo.gif)

Try the live app at [aacboard.app](https://aacboard.app). Core board features work in any modern browser; Built-in AI enhancements require Chrome or Edge with [Built-in AI enabled](#enabling-built-in-ai).

## From taps to clearer messages

Standard AAC boards produce telegraphic output — tapping tiles one at a time yields "want eat pizza." AAC Board AI cleans that up on-device: a grammar-corrected version that keeps the user's own words, plus optional tone variants (direct, professional, or friendly). Each suggestion is a button the user taps to accept:

```
User taps:          [ want ] → [ eat ] → [ pizza ]
Raw text:           "want eat pizza"
Grammar-corrected:  "I want to eat pizza" ← keeps the user's words
Friendly tone:      "I'm craving pizza!"  ← optional, user taps to accept
```

## Who it's for

- **AAC Users** — Communicate faster without typing complete sentences tile by tile.
- **Facilitators (SLPs, Educators, & Families)** — Deploy a ready-to-use, customizable communication board locally or across school networks, entirely offline without cloud subscriptions or data agreements.
- **Developers** — Explore an open-source reference implementation of browser-native, on-device language models in a real React 19 app.

## Key features

- **Grammar Correction** — Fixes grammar while keeping the user's own wording ([Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)).
- **Tone Adjustment** — Rewrites messages in direct, professional, or friendly tones ([Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)).
- **Translation** — Translates board labels and vocalizations between languages ([Translator API](https://developer.chrome.com/docs/ai/translator-api)).
- **Text to Speech** — Reads messages aloud ([Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)).
- **Offline Ready** — Installs as a standalone app with automatic updates ([PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)).
- **Open Board Format** — Imports `.obf` and `.obz` files ([example boards](https://www.openboardformat.org/examples)).

## Enabling Built-in AI

Grammar correction and tone adjustment require experimental browser flags.

**Chrome:**

```
chrome://flags/#proofreader-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
```

**Edge:**

```
edge://flags/#edge-proofreader-api
edge://flags/#edge-llm-rewriter-api-for-phi-mini
```

## Quick start

Requires Node.js 24+.

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Development

```bash
npx playwright install  # One-time: install Chromium for tests
npm run dev             # Start dev server
npm run dev:host        # Dev server, accessible from other devices on your network
npm run lint            # Lint
npm test                # Run tests
npm run build           # Typecheck + production build
```

## Technical stack

- **UI:** React 19 (with the React Compiler), TypeScript, Material UI, React Router
- **AI:** Proofreader, Rewriter & Translator APIs (browser-native, on-device)
- **Speech:** Web Speech API
- **Storage:** IndexedDB (offline-first PWA shell)
- **Data:** open-board-format (OBF/OBZ file parsing)
- **Tooling:** Vite, Vitest, Playwright

See full architecture details in [docs/architecture.md](docs/architecture.md).

## Loading a board via URL

Load a board by passing an OBF or OBZ file URL as the `board` query parameter:

```
https://aacboard.app/?board=https://example.com/board.obz
```

The app fetches, imports, and navigates to the board automatically.

## References

- [Chrome Built‑in AI](https://developer.chrome.com/docs/ai/built-in)
- [Edge Built‑in AI](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api)
- [Open Board Format](https://www.openboardformat.org)

## Contributing

While I'm thrilled if you find this code useful, this repository serves as my personal workspace and I am not accepting pull requests at this time. Feel free to fork the project and adapt it to your own needs under the MIT license.

## License

[MIT](LICENSE) © Shay Cojocaru

---

<div align="center">
  <small>Designed by a Human. Assembled by AI.</small>
</div>

<div align="center">

# AAC Board AI

[![CI](https://github.com/shayc/aac-board-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shayc/aac-board-ai/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

**Winner — [Google Chrome Built-in AI Challenge 2025](https://developer.chrome.com/blog/ai-challenge-winners-2025) (Most Helpful Application)**

**[aacboard.app](https://aacboard.app)**

</div>

---

**AAC Board AI** is an Augmentative and Alternative Communication (AAC) board for people who cannot rely on speech. It uses browser-native **Built-in AI** for on-device grammar correction, tone adjustment, and translation—keeping interactions private, fast, and reliable offline.

![Animated demo](demo.gif)

_Note: Core board features work in any modern browser; Built-in AI features require Chrome or Edge with flags enabled._

## From taps to clearer messages

Standard AAC boards produce telegraphic output—tapping tiles yields `"want eat pizza"`. AAC Board AI cleans that up on-device into a grammar-corrected version that preserves the user's words. Suggestions are interactive buttons the user taps to accept:

```text
User taps:          [ want ] → [ eat ] → [ pizza ]
Raw text:           "want eat pizza"
Grammar-corrected:  "I want to eat pizza"
```

Optional tone variants (direct, professional, friendly) are offered the same way—as suggestions to accept, never applied automatically.

## Who it's for

- **AAC Users** — Communicate faster without typing sentences tile by tile.
- **Facilitators (SLPs & Families)** — Deploy a customizable communication board locally or across school networks entirely offline, without cloud subscriptions or data agreements.
- **Developers** — Explore an open-source reference implementation of browser-native language models in a React 19 app.

## Key features

- **Grammar Correction** — Fixes grammar while keeping the user's wording ([Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)).
- **Tone Adjustment** — Rewrites messages in direct, professional, or friendly tones ([Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)).
- **Translation** — Translates board labels and vocalizations ([Translator API](https://developer.chrome.com/docs/ai/translator-api)).
- **Text to Speech** — Reads messages aloud ([Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)).
- **Offline Ready** — Installs as a standalone app with automatic updates ([PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)).
- **Open Board Format** — Imports `.obf`/`.obz` files ([example boards](https://www.openboardformat.org/examples)), including by URL via `?board=https://example.com/board.obz`.

## Enabling Built-in AI

Turn on the following experimental browser flags:

### Google Chrome

```text
chrome://flags/#proofreader-api
chrome://flags/#rewriter-api-for-gemini-nano
```

### Microsoft Edge

```text
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

## Development Workflow

```bash
npx playwright install --with-deps chromium  # Install test dependencies
npm run dev                                  # Start dev server
npm run dev:host                             # Dev server (network accessible)
npm run lint                                 # Lint code
npm test                                     # Run tests
npm run build                                # Production build
```

### Technical Stack

React 19 (React Compiler), TypeScript, Material UI, React Router, IndexedDB, Vite, Vitest, Playwright. See full details in [docs/architecture.md](docs/architecture.md).

## References

- [Chrome Built‑in AI](https://developer.chrome.com/docs/ai/built-in) | [Edge Built‑in AI](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api) | [Open Board Format](https://www.openboardformat.org)

## Contributing

This repository serves as my personal workspace and I am not accepting pull requests at this time. Feel free to fork the project and adapt it to your own needs under the MIT license.

## License

[MIT](LICENSE) © Shay Cojocaru

---

<div align="center">
  <small>Designed by a Human. Assembled by AI.</small>
</div>

# AAC Board AI

[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

**Winner - [Google Chrome Built-in AI Challenge 2025](https://developer.chrome.com/blog/ai-challenge-winners-2025) (Most Helpful Application)**

**AAC Board AI** is a communication tool for non-verbal users. It uses **Built-in AI** to proofread, rewrite, and translate messages on-device, ensuring privacy and offline reliability.

![Screenshot of AAC Board AI](screenshot.jpg)

Try the live demo at [aacboard.app](https://aacboard.app) _(requires Chrome or Edge with [Built‑in AI flags](#prerequisites))_.

## Key Features

- **Grammar Correction** – Turns short, telegraphic text
  into clear, natural sentences ([Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)).
- **Tone Adjustment** – Rewrites messages into direct, professional, or
  friendly tones ([Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)).
- **Multi-Language Support** – Translates messages between languages ([Translator API](https://developer.chrome.com/docs/ai/translator-api)).
- **Text to Speech** – Reads messages aloud ([Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)).
- **Installable** – Works offline as a standalone app with automatic updates.

## Prerequisites

Requires **Chrome** or **Edge** with Built‑in AI flags enabled.

### Chrome

Enable the following flags and relaunch Chrome:

```
chrome://flags/#proofreader-api-for-gemini-nano
```

```
chrome://flags/#rewriter-api-for-gemini-nano
```

### Edge

Enable the following flag and relaunch Edge:

```
edge://flags/#edge-llm-rewriter-api-for-phi-mini
```

## Quick Start

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install && npm run dev
```

Open http://localhost:5173

## Usage

### Loading a Board via URL

You can load a board directly by passing an OBF or OBZ file URL as the `board` search parameter:

```
https://aacboard.app/?board=https://example.com/board.obz
```

The app will fetch, import, and navigate to the board automatically.

## Development

```bash
npm run dev        # Start dev server
npm run lint       # Lint
npm test           # Run tests (requires Playwright browsers)
npm run build      # Typecheck + production build
```

## Technical Stack

- **UI:** React 19, TypeScript, Material UI, React Router
- **AI:** Gemini Nano (Chrome) / Phi 4 Mini (Edge)
- **Speech:** Web Speech API
- **Storage:** IndexedDB, Zod (OBF), fflate (OBZ)
- **Tooling:** Vite, Vitest, Playwright

See full architecture details in
[docs/architecture.md](docs/architecture.md).

## Example Boards

Download example boards from:
[openboardformat.org/examples](https://www.openboardformat.org/examples)

## References

- [Chrome Built‑in AI](https://developer.chrome.com/docs/ai/built-in) ([Playground](https://chrome.dev/web-ai-demos/built-in-ai-playground/))
- [Edge Built‑in AI](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/prompt-api) ([Playground](https://microsoftedge.github.io/Demos/built-in-ai/playgrounds/))
- [Open Board Format](https://www.openboardformat.org)

## License

[MIT](LICENSE)

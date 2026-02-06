# AAC Board AI

[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

**Winner - [Google Chrome Built-in AI Challenge 2025](https://developer.chrome.com/blog/ai-challenge-winners-2025) (Most Helpful Application)**

**AAC Board AI** is a communication tool for non-verbal users. It uses **Built-in AI** to proofread, rewrite, and translate messages on-device, keeping processing local for stronger privacy and offline use.

![Screenshot of AAC Board AI](screenshot.png)

Try the live demo at [aacboard.app](https://aacboard.app). _(requires
Chrome with [Built‑in AI flags enabled](#prerequisites))_.

## Key Features

- **Grammar Correction** – Turns short, telegraphic text
  into clear, natural sentences ([Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)).
- **Tone Adjustment** – Rewrites messages into direct, professional, or
  friendly tones ([Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)).
- **Multi-Language Support** – Translates messages between languages ([Translator API](https://developer.chrome.com/docs/ai/translator-api)).
- **Text to Speech** – Reads messages aloud ([Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)).
- **Installable** – Works offline as a standalone app with automatic updates.

## Prerequisites

Requires **Chrome 138+** with Built‑in AI flags enabled.

Enable the following flags and relaunch Chrome:

```
chrome://flags/#proofreader-api-for-gemini-nano
```

```
chrome://flags/#rewriter-api-for-gemini-nano
```

## Quick Start

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install && npm run dev
```

Open http://localhost:5173

## Technical Stack

- **UI:** React 19, TypeScript, Material UI, React Router
- **AI:** Built-in AI
- **Speech:** Web Speech API
- **Storage:** IndexedDB, Zod (OBF), fflate (OBZ)
- **Tooling:** Vite, Vitest, Playwright

See full architecture details in
[docs/architecture.md](docs/architecture.md).

## Example Boards

Download example boards from:
[openboardformat.org/examples](https://www.openboardformat.org/examples)

## References

- Chrome Built‑in AI:
  [developer.chrome.com/docs/ai/built-in](https://developer.chrome.com/docs/ai/built-in)
- Edge Built‑in AI Playgrounds:
  [microsoftedge.github.io/Demos/built-in-ai/playgrounds](https://microsoftedge.github.io/Demos/built-in-ai/playgrounds/)
- Open Board Format:
  [openboardformat.org](https://www.openboardformat.org)

## License

[MIT](LICENSE)

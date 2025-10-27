# AAC Board AI

[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

_Google Chrome Built-in AI Challenge 2025_

## Overview

AAC (Augmentative and Alternative Communication) tools help people who cannot rely on speech communicate through symbols, text, or synthesized voice. These tools often use communication boards — visual grids of pictures or words that users tap to form messages.

**AAC Board AI** brings these boards to life with [Chrome's Built-in AI](https://developer.chrome.com/docs/ai/built-in), adding real-time corrections and tone control so messages feel natural and expressive — all powered locally by Gemini Nano for fast, private, reliable offline communication.

![AAC Board AI interface](screenshot.png)

Try the live demo at [aacboard.app](https://aacboard.app), _(requires Chrome 138+ with Built-in AI enabled)_.

## Impact & Features

**Who it helps and how:** people with cerebral palsy, autism, or aphasia — and the therapists who support them. Built-in AI speeds message creation, adjusts tone for any situation, and works entirely offline for total privacy.

**Key Capabilities:**

- **Grammar Correction** – Instantly fixes grammar using the [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)
- **Tone Adjustment** – Rewrites phrases for casual, formal, or neutral delivery through the [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)
- **Multi-Language Support** – Translates messages seamlessly between languages with the [Translator API](https://developer.chrome.com/docs/ai/translator-api)

## Technical Stack

**Frontend:** React 19 • TypeScript • Vite (with React Compiler)  
**UI:** Material UI 7  
**AI:** Chrome Built-in AI (Gemini Nano)  
**Data:** IndexedDB • Zod schema validation  
**Standards:** Open Board Format (OBF/OBZ) support  
**Voice:** Web Speech API

[Architecture →](src/)

## Quick Start

**Requirements:** Chrome 138+ with Built-in AI flags enabled

Paste each link below into Chrome's address bar, enable the feature, and restart Chrome:

```
chrome://flags/#proofreader-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
```

Then run locally:

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## References

- [Chrome Built-in AI Docs](https://developer.chrome.com/docs/ai/built-in)
- [Open Board Format](https://www.openboardformat.org/)

## License

[MIT](./LICENSE) — built with ❤️

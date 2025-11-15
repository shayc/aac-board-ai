# AAC Board AI

AAC Board AI helps people who can’t speak express themselves more naturally, using Chrome’s Built-in AI to proofread, rephrase, and translate messages — all processed locally on the device for privacy and offline use.

[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

## Overview

**AAC Board AI** brings communication boards to life with [Chrome's Built-in AI](https://developer.chrome.com/docs/ai/built-in), adding proofreading and rewriting so messages sound natural and expressive.

![AAC Board AI interface](screenshot.png)

Try the live demo at [aacboard.app](https://aacboard.app). _(requires Chrome 138+ with [Built-in AI flags enabled](#prerequisites))_.

## Impact & Motivation

**The Problem:**  
Traditional AAC communication boards help people with speech disabilities express themselves through symbols but lack natural-language processing. Users tap pictograms word-by-word, often producing telegraphic messages like "me want drink water" instead of "I want to drink water."

**The Solution:**  
AAC Board AI uses Chrome's Built-in AI to transform pictogram-based messages into natural, grammatically correct sentences with adjustable tone.

**Who Benefits:**

- People with cerebral palsy, autism, aphasia, or other speech disabilities
- Speech-language therapists and AAC specialists
- Caregivers and family members

**Why Local AI Matters:**

- ✅ **Privacy:** No data leaves the device
- ✅ **Offline:** Works without internet
- ✅ **Free:** No API costs or usage limits
- ✅ **Fast:** Instant feedback

**Key Features:**

- **Grammar Correction** – Instantly fixes grammar using the [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)
- **Tone Adjustment** – Rewrites phrases for casual, formal, or neutral delivery through the [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)
- **Multi-Language Support** – Translates messages between languages using the [Translator API](https://developer.chrome.com/docs/ai/translator-api)

## Technical Stack

**Frontend:**

- **React 19 + TypeScript 5.9** — UI development with type safety
- **Material UI 7** — UI components and theming
- **React Router 7** — navigation between app pages

**AI Processing:**

- **Chrome Built-in AI (Gemini Nano)** — proofreading, rewriting, translation

**Audio Output:**

- **Web Speech API (SpeechSynthesis)** — local text-to-speech

**Data & Storage:**

- **IndexedDB (idb)** — local storage for boards and assets
- **Zod** — data validation (used for Open Board Format files)
- **fflate** — unzipping OBZ files

**Build & Dev:**

- **Vite 7** — fast development server and build system
- **Vitest + Playwright** — automated tests

For complete technical details and architecture, see [Architecture Documentation →](docs/architecture.md).

## Prerequisites

**Requirements:** Chrome 138+ with Built-in AI flags enabled

Paste each URL below into Chrome's address bar, enable the feature, and restart Chrome:

```
chrome://flags/#proofreader-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
```

## Quick Start

Run locally:

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Example Boards

Download and import example boards from [openboardformat.org/examples](https://www.openboardformat.org/examples).

## References

- [Chrome Built-in AI Docs](https://developer.chrome.com/docs/ai/built-in)
- [Open Board Format](https://www.openboardformat.org/)

## Acknowledgements

This project was built for the _Google Chrome Built-in AI Challenge 2025_.

## License

[MIT](./LICENSE)

# AAC Board AI

AAC Board AI helps people who can’t speak express themselves more naturally, using Chrome’s Built-in AI to proofread, rephrase, and translate messages instantly, privately and offline.

[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

## Overview

AAC (Augmentative and Alternative Communication) tools help people who can’t rely on speech communicate through symbols, text, or synthesized voice. These tools often use communication boards — visual grids of pictures or words that users tap to form messages.

**AAC Board AI** brings these boards to life with [Chrome's Built-in AI](https://developer.chrome.com/docs/ai/built-in), adding proofreading and rewriting so messages sound natural and expressive — all powered locally by Gemini Nano for private, offline communication.

![AAC Board AI interface](screenshot.png)

Try the live demo at [aacboard.app](https://aacboard.app). _(requires Chrome 138+ with [Built-in AI enabled](#prerequisites))_.

## Impact & Motivation

**The Problem:**  
Traditional AAC communication boards help people with speech disabilities express themselves through symbols, but the boards lack natural language processing. Users tap pictograms to form messages word-by-word, often resulting in grammatically incorrect or contextually inappropriate sentences like "me want drink water" instead of "I want to drink water."

**The Solution:**  
AAC Board AI uses Chrome's Built-in AI to transform pictogram-based messages into natural, grammatically correct sentences with adjustable tone — all processed locally on the user's device for privacy and offline reliability.

**Who Benefits:**

- People with cerebral palsy, autism, aphasia, or other speech disabilities
- Speech-language therapists and AAC specialists
- Caregivers and family members

**Why Local AI Matters:**

- ✅ **Privacy:** No data leaves the device
- ✅ **Offline:** Works without internet after initial setup
- ✅ **Free:** No API costs or usage limits
- ✅ **Fast:** Instant feedback

**Key Features:**

- **Grammar Correction** – Instantly fixes grammar using the [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)
- **Tone Adjustment** – Rewrites phrases for casual, formal, or neutral delivery through the [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)
- **Multi-Language Support** – Translates messages between languages using the [Translator API](https://developer.chrome.com/docs/ai/translator-api)

## Technical Stack

Built with React 19, TypeScript, Vite, and Material UI. Powered entirely by Chrome’s on-device Gemini Nano for local AI processing. For complete technical details and architecture, see [Architecture Documentation →](docs/architecture.md).

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

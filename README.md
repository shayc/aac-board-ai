# AAC Board AI

AAC Board AI helps people who can't speak express themselves more
naturally, using **Chrome's Built-in AI** to proofread, rewrite, and
translate messages - all processed locally on the device for privacy
and offline use.

[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

## Overview

AAC (Augmentative and Alternative Communication) tools often rely on pictogram-based communication boards. AAC Board AI enhances this experience with Chrome’s Built-in AI, turning tapped pictograms into **fully formed sentences** for faster, more expressive communication.

![Screenshot of AAC Board AI, an AI-powered pictogram-based AAC board](screenshot.png)

Try the live demo at [aacboard.app](https://aacboard.app). _(requires
Chrome 138+ with [Built‑in AI flags enabled](#prerequisites))_.

## Impact & Motivation

**The Problem:**

Traditional communication boards help users express intent, but the
output is often incomplete or robotic, making conversations slower and
less natural. Users tap pictograms word-by-word, often producing
telegraphic messages like "me want drink water" instead of "I want to
drink water."

**The Solution:**

AAC Board AI uses Chrome's Built‑in AI to transform pictogram-based
messages into **natural, grammatically correct sentences** with adjustable
tone.

**Who Benefits:**

- People with cerebral palsy, autism, aphasia, or other speech
  disabilities
- Speech-language therapists and AAC specialists
- Caregivers and family members

**Why Local AI Matters:**

- **Privacy** - No data leaves the device
- **Offline** - Works without internet
- **Free** - No API costs or usage limits
- **Fast** - Instant feedback

## Key Features

- **Grammar Correction** - Instantly fixes grammar using the
  [Proofreader
  API](https://developer.chrome.com/docs/ai/proofreader-api)
- **Tone Adjustment** - Rewrites phrases for casual, formal, or
  neutral delivery using the [Rewriter
  API](https://developer.chrome.com/docs/ai/rewriter-api)
- **Multi-Language Support** - Translates messages using the
  [Translator
  API](https://developer.chrome.com/docs/ai/translator-api)

## Prerequisites

Requires **Chrome 138+** with Built‑in AI flags enabled.

Enable these flags and restart Chrome:

    chrome://flags/#proofreader-api-for-gemini-nano
    chrome://flags/#rewriter-api-for-gemini-nano

## Quick Start

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install && npm run dev
```

Open http://localhost:5173

## Technical Stack

**Frontend**

- React 19 + TypeScript 5.9
- Material UI 7
- React Router 7

**AI Processing**

- Chrome Built-in AI (Gemini Nano)

**Audio Output**

- Web Speech API (SpeechSynthesis)

**Data & Storage**

- IndexedDB (idb)
- Zod (Open Board Format validation)
- fflate (OBZ extraction)

**Build & Dev**

- Vite 7
- Vitest + Playwright

See full architecture details:
[docs/architecture.md](docs/architecture.md).

## Example Boards

Download and import example boards from:\
https://www.openboardformat.org/examples

## References

- Chrome Built‑in AI Docs:
  https://developer.chrome.com/docs/ai/built-in
- Open Board Format: https://www.openboardformat.org/

## Acknowledgements

Built for the Google Chrome Built‑in AI Challenge 2025.

## License

MIT

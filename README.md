# AAC Board AI

## Overview

**AAC Board AI** helps people with speech or language challenges communicate more naturally and confidently.  
It combines board-based Augmentative and Alternative Communication (AAC) with Google Chrome’s [**Built-in AI**](https://developer.chrome.com/docs/ai/built-in) — delivering real-time corrections, tone adjustments, and translations directly in the browser.

All processing runs locally through **Gemini Nano**, ensuring instant responses, strong privacy, and reliable offline use.

## Google Chrome’s Built-in AI

AAC Board AI integrates Google Chrome’s Built-in AI APIs to refine and personalize messages directly in the browser:

- [`Proofreader`](https://developer.chrome.com/docs/ai/proofreader-api) – Corrects phrasing and grammar
- [`Rewriter`](https://developer.chrome.com/docs/ai/rewriter-api) – Adjusts tone (neutral, formal, casual)
- [`Writer`](https://developer.chrome.com/docs/ai/writer-api) – Suggests next words and phrases in context
- [`Translator`](https://developer.chrome.com/docs/ai/translator-api) – Translates messages between languages

Together, these APIs enable expressive, privacy-preserving communication without external servers.

## Quick Start

**Requirements:** Google Chrome 138+ with Built-in AI enabled.

Enable the experimental flags:

```
chrome://flags/#proofreader-api-for-gemini-nano
chrome://flags/#writer-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
```

Then run locally:

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Chrome.

## Tech Stack

- **React 19**, **TypeScript**, **Vite** – modern, reactive front end
- **IndexedDB** (`idb`) + **Zod** – validated offline data schema
- **Material UI 7** – visual framework
- **Google Chrome Built-in AI (Gemini Nano)** – local language intelligence
- **Web Speech API (SpeechSynthesis)** – converts output to natural voice

## License

Licensed under the **MIT License**.  
Implements the **[Open Board Format specification](https://www.openboardformat.org/docs)** for compatibility across AAC tools.

# AAC Board AI

_Google Chrome Built-in AI Challenge 2025_

## Overview

AAC Board AI helps people with speech challenges express themselves more naturally by combining traditional symbol-based boards with [Chrome’s Built-in AI](https://developer.chrome.com/docs/ai/built-in). It offers context-aware suggestions, tone control, and instant corrections — all running locally on-device through Gemini Nano for private, reliable, offline communication.

![AAC Board AI interface](screenshot.png)

## Chrome Built-in AI Integration

Five on-device APIs working together for expressive, private communication:

- **[Language Detector API](https://developer.chrome.com/docs/ai/language-detection)** – Detects user’s language automatically
- **[Prompt API](https://developer.chrome.com/docs/ai/prompt-api)** – Suggests board-aware words and phrases
- **[Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)** – Corrects grammar and phrasing
- **[Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)** – Adjusts tone (neutral / formal / casual)
- **[Translator API](https://developer.chrome.com/docs/ai/translator-api)** – Translates boards and messages in real time

**Benefits:** Instant responses, complete privacy, offline functionality, zero API costs.

[Implementation →](src/shared/hooks/ai/)

## Technical Stack

**Frontend:** React 19 • TypeScript • Vite (with [React Compiler](https://react.dev/learn/react-compiler))  
**UI:** Material UI 7  
**AI:** Chrome Built-in AI (Gemini Nano)  
**Data:** IndexedDB • Zod schema validation  
**Standards:** Open Board Format (OBF/OBZ) support  
**Voice:** Web Speech API

[Architecture →](src/)

## Quick Start

**Requirements:** Chrome 138+ with Built-in AI flags enabled

### 1. Enable Chrome’s Built-in AI

Paste each link below into Chrome’s address bar, enable the feature, then restart the browser.

```
chrome://flags/#proofreader-api-for-gemini-nano
chrome://flags/#writer-api-for-gemini-nano
chrome://flags/#rewriter-api-for-gemini-nano
```

### 2. Run

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Key Features

**AI-Enhanced:**

- **Suggests** words during composition
- **Corrects** grammar automatically
- **Adjusts** message tone
- **Translates** across languages

**Standard AAC:**

- Grid-based boards
- Text-to-speech output
- Open Board Format import (OBF/OBZ files)

## Development

```bash
npm run dev      # Start development
npm run build    # Production build
npm run lint     # Code quality
```

## References

- [Chrome Built-in AI Docs](https://developer.chrome.com/docs/ai/built-in)
- [Open Board Format](https://www.openboardformat.org/)

## License

[MIT](./LICENSE) — built with ❤️ for open AAC interoperability through [Open Board Format](https://www.openboardformat.org/)

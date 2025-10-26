# AAC Board AI

_Google Chrome Built-in AI Challenge 2025_

## Overview

AAC Board AI helps people with speech challenges express themselves more naturally by combining traditional symbol-based boards with [Chrome's Built-in AI](https://developer.chrome.com/docs/ai/built-in). It offers context-aware suggestions, tone control, and instant corrections — all running locally on-device through Gemini Nano for private, reliable, offline communication.

![AAC Board AI interface](screenshot.png)

## Demo

🎥 **Video Demo:** [Coming Soon]
🌐 **Live Demo:** [Try it here](https://aacboard.app) _(Requires Chrome 138+ with Built-in AI enabled)_

## Chrome Built-in AI Integration

Five on-device APIs working together for expressive, private communication:

- **[Language Detector API](https://developer.chrome.com/docs/ai/language-detection)** – Detects user's language automatically
- **[Prompt API](https://developer.chrome.com/docs/ai/prompt-api)** – Suggests board-aware words and phrases
- **[Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)** – Corrects grammar and phrasing
- **[Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)** – Adjusts tone (neutral / formal / casual)
- **[Translator API](https://developer.chrome.com/docs/ai/translator-api)** – Translates boards and messages in real time

**Benefits:** Instant responses, complete privacy, offline functionality, zero API costs.

[Implementation →](src/shared/hooks/ai/)

## How It Works

**AI-Powered Message Composition:**

1. User taps symbols to compose message
2. Proofreader API corrects grammar in real-time
3. Rewriter API offers tone variations (casual/formal/neutral)
4. Prompt API analyzes board context and suggests relevant words
5. User selects suggestion or speaks original message

**Privacy-First:** All AI processing happens on-device via Gemini Nano — no data leaves your browser.

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

### 1. Enable Chrome's Built-in AI

Paste each link below into Chrome's address bar, enable the feature, then restart the browser.Ø

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

**AI-Enhanced Communication:**

- **Grammar Correction** – Proofreader API fixes mistakes in real-time
- **Tone Adjustment** – Rewriter API adapts message for casual, formal, or neutral contexts
- **Context-Aware Suggestions** – Prompt API suggests relevant words based on board context
- **Multi-Language Support** – Translator API enables cross-language communication

**Standard AAC Features:**

- Grid-based communication boards
- Text-to-speech output via Web Speech API
- Open Board Format (OBF/OBZ) import support
- Offline functionality with IndexedDB storage

## Impact & Use Cases

**Primary Users:**

- People with cerebral palsy, autism, or aphasia
- Speech therapists customizing communication boards
- Multilingual AAC users needing translation

**Real-World Benefits:**

- Faster message composition with AI suggestions
- Natural tone control for different social contexts
- Complete privacy with on-device processing
- Works offline (hospitals, schools, travel)

## Technical Highlights

**Architecture:**

- React 19 with React Compiler for optimal performance
- TypeScript with Zod schema validation
- Custom hooks for each AI API ([see implementation](src/shared/hooks/ai/))
- IndexedDB for offline board storage
- Material UI 7 for accessible components

**AI Integration:**

- Session management with download progress monitoring
- Graceful fallback when APIs unavailable
- Efficient prompt engineering for AAC context

## Development

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Code quality check
```

## References

- [Chrome Built-in AI Docs](https://developer.chrome.com/docs/ai/built-in)
- [Open Board Format](https://www.openboardformat.org/)

## License

[MIT](./LICENSE) — built with ❤️

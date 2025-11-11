# AAC Board AI

AAC Board AI helps people who can’t speak express themselves more naturally, using Chrome’s Built-in AI to proofread, rephrase, and translate messages instantly, privately and offline.

[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

## Overview

AAC (Augmentative and Alternative Communication) tools help people who can’t rely on speech communicate through symbols, text, or synthesized voice. These tools often use communication boards — visual grids of pictures or words that users tap to form messages.

**AAC Board AI** brings these boards to life with [Chrome's Built-in AI](https://developer.chrome.com/docs/ai/built-in), adding smart suggestions and tone control so messages sound natural and expressive — all powered locally by Gemini Nano for private, offline communication.

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

Built with React 19, TypeScript, and Material UI. Powered entirely by Chrome’s on-device Gemini Nano for local AI processing. For complete technical details and architecture, see [Architecture Documentation →](docs/architecture.md).

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

## AI Architecture

AAC Board AI uses a centralized service layer architecture for interacting with Chrome's Built-in AI APIs. This design provides consistent error handling, caching, and cancellation support across all AI features.

### Service Layer (`src/features/ai/aiService.ts`)

The service layer encapsulates all AI API calls with:

- **Unified Error Handling**: Custom `AIError` class with standardized error codes
- **Capability Detection**: Runtime checks for API availability
- **Caching**: Two-tier caching (in-memory Map + IndexedDB) with 24-hour TTL
- **Input Validation**: Zod schemas for type-safe parameters
- **Cancellation**: AbortSignal support for all operations

#### Core Functions

```typescript
// Proofread text for grammar/spelling corrections
proofread(text: string, signal?: AbortSignal): Promise<string>

// Rewrite text with tone adjustment
rewrite(text: string, tone: Tone, signal?: AbortSignal): Promise<string>
// Tone options: 'casual' | 'formal' | 'neutral'

// Translate text between languages
translate(
  text: string,
  targetLang: LanguageCode,
  sourceLang?: LanguageCode,
  signal?: AbortSignal
): Promise<string>

// Check API availability
isAvailable(kind: 'proofreader' | 'rewriter' | 'translator'): boolean
```

#### Error Codes

| Code               | Description                                        | Handling            |
| ------------------ | -------------------------------------------------- | ------------------- |
| `UNAVAILABLE`      | API not available in browser                       | Skip operation      |
| `UNSUPPORTED_LANG` | Language pair not supported                        | Skip translation    |
| `ABORTED`          | Operation cancelled by user                        | Silent cancellation |
| `INTERNAL`         | Unexpected error from Chrome AI or validation fail | Show error to user  |

### React Hooks (`src/features/ai/hooks/`)

#### Individual AI Hooks

Lightweight wrappers around service functions:

```typescript
const { available, status, data, error, run, cancel } = useProofread();
const { available, status, data, error, run, cancel } = useRewrite();
const { available, status, data, error, run, cancel } = useTranslate();
```

**Status lifecycle**: `idle` → `running` → `success` | `error`

#### Message Pipeline Hook

Orchestrates the complete AI transformation pipeline:

```typescript
const { step, result, error, run, cancel, setOnStepChange } =
  useMessagePipeline();

// Run pipeline with optional tone and translation
await run(rawText, {
  tone: "formal", // Optional: casual | formal | neutral
  translateTo: "es", // Optional: BCP-47 language code
  sourceLang: "en", // Optional: defaults to 'en'
});
```

**Pipeline steps**: `idle` → `proofreading` → `rewriting` (optional) → `translating` (optional) → `done` | `error`

**Result structure**:

```typescript
{
  original: string;        // Input text
  proofread?: string;      // After grammar correction
  rewritten?: string;      // After tone adjustment
  translated?: string;     // After translation
  final: string;           // Final output
  skippedSteps: string[];  // Steps skipped due to unavailability
}
```

### Graceful Degradation

The architecture prioritizes user experience even when AI features are unavailable:

1. **Capability Detection**: Runtime checks before API calls
2. **Skip Unavailable Steps**: Continue pipeline even if some APIs are missing
3. **Fallback Behavior**: Return original text if all transformations fail
4. **Cache Persistence**: Serve cached results when APIs temporarily unavailable

### Accessibility

`AIAnnouncementRegion` component provides screen reader announcements for each pipeline step:

- "Checking grammar and spelling..."
- "Adjusting tone..."
- "Translating message..."
- "Message transformation complete."

### Caching Strategy

**Two-tier cache** balances performance and persistence:

1. **In-Memory Map**: Fast lookups for recently used transformations
2. **IndexedDB**: Persistent cache survives page reloads

**Cache key**: JSON.stringify of operation + parameters  
**TTL**: 24 hours  
**Invalidation**: Manual via `clearCache()` or automatic expiration

**Example**: Same text + tone will reuse cached result, different tone creates new entry.

### Usage Example

```typescript
import { useMessagePipeline } from '@features/ai/hooks';
import { AIAnnouncementRegion } from '@features/ai/components/AIAnnouncementRegion';

function MessageComposer() {
  const pipeline = useMessagePipeline();

  const handleTransform = async () => {
    await pipeline.run('me want drink water', {
      tone: 'formal',
      translateTo: 'es'
    });

    // Result: "I would like to drink water." → "Me gustaría beber agua."
    console.log(pipeline.result?.final);
  };

  return (
    <>
      <AIAnnouncementRegion step={pipeline.step} />
      {/* Your UI */}
    </>
  );
}
```

## References

- [Chrome Built-in AI Docs](https://developer.chrome.com/docs/ai/built-in)
- [Open Board Format](https://www.openboardformat.org/)

## Acknowledgements

This project was built for the _Google Chrome Built-in AI Challenge 2025_.

## License

[MIT](./LICENSE) — built with ❤️

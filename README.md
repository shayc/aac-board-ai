<div align="center">

# AAC Board AI

[![CI](https://github.com/shayc/aac-board-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shayc/aac-board-ai/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/d6e3dbf1-40d1-4343-9f56-3c9368d2fe56/deploy-status)](https://app.netlify.com/projects/aacboard/deploys)

**Winner — [Google Chrome Built-in AI Challenge 2025](https://developer.chrome.com/blog/ai-challenge-winners-2025) (Most Helpful Application)**

**[aacboard.app](https://aacboard.app)**

</div>

**AAC Board AI** is a local-first Augmentative and Alternative Communication (AAC) board for people who cannot rely on speech. Core board features work offline after the app and a board have been loaded, while optional browser-native **Built-in AI** improves grammar, adjusts tone, and translates boards on-device.

![Demo: selecting “want,” “go,” and “my room,” accepting “I’m heading to my room now,” and playing the message aloud](demo.gif)

_Built-in AI is a progressive enhancement; availability depends on the browser, device, language, and downloaded models._

## From taps to clearer messages

Selecting tiles often produces telegraphic output such as `"want eat pizza"`. AAC Board AI can suggest a corrected sentence on-device without applying it automatically:

```text
User taps:          [ want ] → [ eat ] → [ pizza ]
Raw text:           "want eat pizza"
Grammar-corrected:  "I want to eat pizza"
```

It can also suggest concise rewrites in the original or a friendlier tone. Every suggestion remains an interactive button until the user accepts it.

## Who it's for

- **AAC users** — Communicate faster without selecting every word individually.
- **Facilitators** — Speech-language pathologists (SLPs), educators, and families can customize and deploy boards without a backend or cloud subscription.
- **Developers** — Explore an open-source reference implementation of browser-native language models in a React 19 app.

## Key features

- **Grammar correction** — Fixes grammar while keeping the user's wording ([Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api)).
- **Tone adjustment** — Suggests concise rewrites in the original or a friendlier tone ([Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)).
- **Translation** — Translates board labels and vocalizations ([Translator API](https://developer.chrome.com/docs/ai/translator-api)).
- **Text-to-speech** — Reads messages aloud ([Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)).
- **Accessible input** — Supports keyboard navigation and one- or two-switch scanning.
- **Offline and installable** — Caches the app shell for offline use and installs as a standalone app ([PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)).
- **Open Board Format** — Imports `.obf`/`.obz` files ([example boards](https://www.openboardformat.org/examples)), including by URL via `?board=https://example.com/board.obz`.

## Built-in AI support

Built-in AI is optional and detected at runtime. Support varies by browser, operating system, hardware, language, and model availability. An initial model download may require an unmetered connection; the core board continues to work when these APIs are unavailable.

Because these APIs are evolving, follow the current setup instructions for each browser:

- **Google Chrome:** [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api), [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api), and [Translator API](https://developer.chrome.com/docs/ai/translator-api).
- **Microsoft Edge:** [Proofreader API](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/proofreader-api), [Writing Assistance APIs](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/writing-assistance-apis), and [Translator API](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/translator-api).

## Quick start

Requires Node.js 24+.

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Development

```bash
npx playwright install --with-deps  # Install browser test dependencies
npm run dev                         # Start the development server
npm run dev:host                    # Start a network-accessible server
npm run lint                        # Lint the code
npm test                            # Run the tests
npm run build                       # Type-check and build for production
```

## Technical stack

React 19 with the React Compiler, TypeScript, Material UI, React Router, IndexedDB, Vite, Vitest, and Playwright. See [docs/architecture.md](docs/architecture.md) for the design and module boundaries.

## Contributing

This repository is a personal workspace, so pull requests are not accepted. You may fork the project and adapt it under the MIT license.

## License

[MIT](LICENSE) © Shay Cojocaru

<div align="center">
  <small>Designed by a human. Assembled by AI.</small>
</div>

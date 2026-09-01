<div align="center">

# AAC Board AI

**Winner of the [Google Chrome Built-in AI Challenge 2025](https://developer.chrome.com/blog/ai-challenge-winners-2025) — Most Helpful Application**

**[Try AAC Board AI](https://aacboard.app)**

[![CI](https://github.com/shayc/aac-board-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shayc/aac-board-ai/actions/workflows/ci.yml)

</div>

**AAC Board AI** is a local-first Augmentative and Alternative Communication (AAC) board for people who cannot rely on speech. It helps users build messages with symbols and speak them aloud.

On supported browsers, **Built-in AI** uses the browser’s on-device models to proofread messages, rewrite them, and translate board content. No API key or cloud AI service is required, and core communication works without Built-in AI.

![Demo: selecting “want,” “go,” and “my room,” accepting “I’m heading to my room now,” and playing the message aloud](demo.gif)

## Expanding a message with Built-in AI

AAC users may select a few key concepts instead of composing every word explicitly:

```text
Selected tiles:  [ want ] → [ eat ] → [ pizza ]
Board message:   "want eat pizza"
AI suggestion:   "I want to eat pizza."
```

Suggestions are optional and replace the original message only when accepted.

## Core features

- Quick Core 24 starter board with linked vocabulary
- Touch and keyboard navigation
- [Open Board Format](https://www.openboardformat.org) (`.obf` and `.obz`) imports from a device or URL
- 35 interface languages and right-to-left layouts
- Installable PWA with offline communication

## Privacy and offline use

AAC Board AI has no accounts, backend, telemetry, or tracking. Boards, messages, settings, and cached translations stay on the device. Loading third-party media contacts external hosts.

Stored boards remain available offline. URL imports and remote resources require a connection. Media and text-to-speech availability depend on the platform and selected voice.

## Limitations

Boards can be imported and stored, but not edited, exported, or synchronized between devices. Prepare custom boards with an Open Board Format-compatible tool and import them on each device.

## Built-in AI availability

Support varies by browser, device, language, and model availability.

Proofreading and rewriting currently require experimental browser flags:

- **Google Chrome:** `chrome://flags/#proofreader-api` and `chrome://flags/#rewriter-api`
- **Microsoft Edge Canary or Dev:** `edge://flags/#edge-proofreader-api` and `edge://flags/#edge-llm-rewriter-api-for-phi-mini`

Enable the flags and restart your browser. See the API documentation for current requirements:

| Browser        | API documentation                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Chrome  | [Proofreader](https://developer.chrome.com/docs/ai/proofreader-api) · [Rewriter](https://developer.chrome.com/docs/ai/rewriter-api) · [Translator](https://developer.chrome.com/docs/ai/translator-api)                                                                                       |
| Microsoft Edge | [Proofreader](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/proofreader-api) · [Rewriter](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/writing-assistance-apis) · [Translator](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/translator-api) |

## Develop locally

Requires Node.js 24+.

```bash
git clone https://github.com/shayc/aac-board-ai.git
cd aac-board-ai
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Tests run in Chromium; install Playwright with `npx playwright install --with-deps`, then run `npm test`.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the stack, module boundaries, storage model, and accessibility invariants. The Open Board Format and Built-in AI integrations are also available as [@shayc/open-board-format](https://github.com/shayc/open-board-format) and [@shayc/react-built-in-ai](https://github.com/shayc/react-built-in-ai).

## Contributing

The project is currently maintained by a single developer, so contributions are limited. Bug reports and feedback are welcome.

## License

[MIT](LICENSE) © Shay Cojocaru

The bundled Quick Core 24 board is by [OpenAAC](https://www.openaac.org) and licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

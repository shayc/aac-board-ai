# `built-in-ai`

A thin React layer over the browser's [Built-in AI](https://developer.chrome.com/docs/ai/built-in) APIs — Gemini Nano on Chrome, Phi 4 Mini on Edge. Six hooks plus a few helpers, all sharing one lifecycle state machine.

```ts
import { useSummarizer } from "@shared/built-in-ai";
```

## Hooks

- `useSummarizer` — wraps the [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api).
- `useWriter` — wraps the [Writer API](https://developer.chrome.com/docs/ai/writer-api).
- `useRewriter` — wraps the [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api).
- `useTranslator` — wraps the [Translator API](https://developer.chrome.com/docs/ai/translator-api).
- `useLanguageDetector` — wraps the [Language Detector API](https://developer.chrome.com/docs/ai/language-detection).
- `useProofreader` — wraps the [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api).

Every hook returns the same lifecycle surface and namespace-specific action methods (e.g. `summarize`, `summarizeStream`, `measureInput`).

## Lifecycle

```ts
const { status, progress, error, prepare } = useSummarizer({ type: "tldr" });
```

`status` walks through `"unsupported" | "unavailable" | "idle" | "downloading" | "ready" | "error"`. When the model is already available the hook auto-creates the instance and arrives at `"ready"`. When a download is required the hook stays at `"idle"` until `prepare()` (or any action method) is called from a user activation — then `status` advances to `"downloading"` and `progress` ticks from `0` to `1`.

## Acting

Action methods are gated by the lifecycle: they throw `UnsupportedError`, `UnavailableError`, `NoUserActivationError`, or `NotReadyError` when the state forbids them. A rejected call never mutates the hook's `status` or `error`.

```tsx
function Demo() {
  const summarizer = useSummarizer({ length: "short" });

  if (summarizer.status === "unsupported") return <p>Not supported.</p>;
  if (summarizer.status === "unavailable") return <p>Not available.</p>;

  return (
    <button
      disabled={summarizer.status === "downloading"}
      onClick={async () => {
        const out = await summarizer.summarize("…long text…");
        console.log(out);
      }}
    >
      {summarizer.status === "ready"
        ? "Summarize"
        : `Prepare (${(summarizer.progress * 100) | 0}%)`}
    </button>
  );
}
```

Streaming:

```ts
for await (const chunk of summarizer.summarizeStream(text, { signal })) {
  emit(chunk);
}
```

## Options

Options are compared by shallow per-key equality. Memoize array-valued options (`expectedInputLanguages`, etc.) to avoid spurious re-creation. Changing any option destroys the current instance, aborts in-flight work with `AbortError`, and re-enters the state machine.

## Errors

All thrown errors are `instanceof BuiltInAIError`. When the underlying browser API rejects, the hook's `error.cause` is the original error.

- `UnsupportedError` — the global namespace is missing.
- `UnavailableError` — the model reports `"unavailable"`.
- `NoUserActivationError` — a download was needed but no user activation was present.
- `NotReadyError` — the lifecycle is in `"error"` state; call `prepare()` to retry.

## Other exports

- `createTranslator(options)` — imperative `Translator` factory for call sites that decide the language pair mid-flow and can't drive a hook. Reports progress through the same store the hooks write to. Returns `null` when unsupported or unavailable. The returned instance is `AsyncDisposable`, so the recommended lifecycle is:

  ```ts
  await using translator = await createTranslator({
    sourceLanguage,
    targetLanguage,
  });
  if (translator) {
    const text = await translator.translate(input);
  }
  ```

  `.destroy()` is still exposed for callers that need to release the model before scope exit.

- `useDownloadProgress(prefix)` — highest in-flight progress (`0..1`) across all instances matching a namespace prefix (e.g. `"Translator"` aggregates every language pair currently downloading).
- `useSharedContext()` / `setSharedContext(value)` — user-authored context (tone, persona) persisted to `localStorage`. Consumers pass it explicitly into hook options as `sharedContext`.
- `isSupported(name)` — capability check for a given built-in AI namespace (`"Translator"`, `"Summarizer"`, etc.).

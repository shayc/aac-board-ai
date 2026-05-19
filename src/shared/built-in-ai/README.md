# `built-in-ai`

A thin React layer over the browser's [Built-in AI](https://developer.chrome.com/docs/ai/built-in) APIs — Gemini Nano on Chrome, Phi 4 Mini on Edge. Three hooks plus a few helpers, all sharing one lifecycle state machine.

```ts
import { useTranslator } from "@shared/built-in-ai";
```

## Hooks

| Hook             | Underlying API                                                          |
| ---------------- | ----------------------------------------------------------------------- |
| `useRewriter`    | [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)       |
| `useTranslator`  | [Translator API](https://developer.chrome.com/docs/ai/translator-api)   |
| `useProofreader` | [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api) |

Every hook returns the same lifecycle surface plus namespace-specific action methods (e.g. `translate`, `translateStream`, `measureInput`).

`useProofreader` is the one exception: the underlying API exposes neither `measureInputUsage` nor `inputQuota`, so its hook return omits `measureInput` and `inputQuota`.

## Lifecycle

```ts
const { status, progress, error, prepare } = useTranslator({
  sourceLanguage: "en",
  targetLanguage: "es",
});
```

`status` is always one of:

- **`unsupported`** — the global namespace is missing on this browser.
- **`unavailable`** — the model reports it cannot run on this device.
- **`idle`** — supported, but a download is required before use.
- **`downloading`** — entered via **`prepare()`** (or any action method) called from a **user activation**. `progress` ticks from `0` to `1`.
- **`ready`** — the instance is live; action methods can be called freely.
- **`error`** — `availability()` or `create()` rejected. Call `prepare()` to retry.

## Acting

Action methods are gated by the lifecycle — they throw `UnsupportedError`, `UnavailableError`, `NoUserActivationError`, or `NotReadyError` when the state forbids them. **A rejected call never mutates the hook's `status` or `error`.**

```tsx
function Demo() {
  const translator = useTranslator({
    sourceLanguage: "en",
    targetLanguage: "es",
  });

  // 1. Guard against browsers/devices that can't run the model.
  if (translator.status === "unsupported") return <p>Not supported.</p>;
  if (translator.status === "unavailable") return <p>Not available.</p>;

  return (
    <button
      // 2. Block re-entry while the model is downloading.
      disabled={translator.status === "downloading"}
      onClick={async () => {
        // 3. The click is a user activation, so the hook is allowed to start
        //    the download here if status was "idle"; otherwise it runs at once.
        const out = await translator.translate("…some text…");
        console.log(out);
      }}
    >
      {translator.status === "ready"
        ? "Translate"
        : `Prepare (${(translator.progress * 100) | 0}%)`}
    </button>
  );
}
```

Streaming:

```ts
for await (const chunk of translator.translateStream(text, { signal })) {
  emit(chunk);
}
```

## Options

Options are compared by **shallow per-key equality**. Memoize array-valued options (`expectedInputLanguages`, etc.) to avoid spurious re-creation. **Changing any option destroys the current instance, aborts in-flight work with `AbortError`, and re-enters the state machine.**

## Errors

Lifecycle gating throws `BuiltInAIError` subclasses (table below). Action methods (`translate`, `rewrite`, …) pass the browser API's own rejections through unchanged — most commonly an `AbortError` `DOMException` when a `signal` fires. When the lifecycle wraps a browser rejection into `"error"` state, the original error is preserved as `error.cause`.

| Error                   | What to do                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `UnsupportedError`      | The namespace is missing. Feature-detect with `isSupported()` and render a fallback.                                          |
| `UnavailableError`      | The device can't run the model. Render a fallback; don't retry.                                                               |
| `NoUserActivationError` | A download was needed without a user gesture. Trigger `prepare()` (or the first action) from a click/keypress handler.        |
| `NotReadyError`         | A prior `create()` failed. Call `prepare()` from a user activation to retry; inspect `error.cause` for the underlying reason. |

## Cancellation

A per-call `signal` cancels the _caller's_ wait and the underlying action call, but does not tear down the shared model instance. If the hook is mid-download, aborting one call rejects that call with `AbortError` while the download keeps running for any other caller (and for the next call from the same component). **The download is only cancelled when the component unmounts or its options change.**

## Other exports

- `createTranslator(options)` — imperative `Translator` factory for call sites that decide the language pair mid-flow and can't drive a hook. Mirrors the hook lifecycle: throws `UnsupportedError` / `UnavailableError` / `NoUserActivationError` under the same conditions, and reports progress through the same store the hooks write to. The returned instance is `AsyncDisposable`:

  ```ts
  try {
    await using translator = await createTranslator({
      sourceLanguage,
      targetLanguage,
    });
    const text = await translator.translate(input);
  } catch (error) {
    if (!(error instanceof BuiltInAIError)) throw error;
    // unsupported / unavailable / no-activation — render a fallback.
  }
  ```

  `.destroy()` is still exposed for callers that need to release the model before scope exit. Because `createTranslator` requires a user activation when a download is needed, prefer calling it from an event handler (or pre-warm via a hook before the call site is reached).

- `useDownloadProgress(prefix)` — highest in-flight progress (`0..1`) across all instances matching a namespace prefix (e.g. `"Translator"` aggregates every language pair currently downloading).
- `isSupported(name)` — capability check for a given built-in AI namespace (`"Translator"`, `"Rewriter"`, `"Proofreader"`).

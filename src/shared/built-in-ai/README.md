# `built-in-ai`

A thin React layer over the browser's [Built-in AI](https://developer.chrome.com/docs/ai/built-in) APIs — Gemini Nano on Chrome, Phi 4 Mini on Edge. Three task APIs, each with a React hook and an imperative creator, all sharing one lifecycle state machine.

```ts
import { useTranslator, createTranslator } from "@shayc/react-built-in-ai";
```

## Surface

| Task API    | React hook       | Imperative creator  | Underlying browser API                                                  |
| ----------- | ---------------- | ------------------- | ----------------------------------------------------------------------- |
| Translator  | `useTranslator`  | `createTranslator`  | [Translator API](https://developer.chrome.com/docs/ai/translator-api)   |
| Rewriter    | `useRewriter`    | `createRewriter`    | [Rewriter API](https://developer.chrome.com/docs/ai/rewriter-api)       |
| Proofreader | `useProofreader` | `createProofreader` | [Proofreader API](https://developer.chrome.com/docs/ai/proofreader-api) |

**Use the hook** when the options are known at render time (e.g. a translator bound to the user's current language pair). **Use the creator** when options are decided mid-flow and a hook can't be driven (queued work, command palettes, one-shot scripts).

Every hook returns the same lifecycle surface plus namespace-specific action methods (e.g. `translate`, `translateStream`, `measureInput`). `useProofreader` is the one exception: the underlying API exposes neither `measureInputUsage` nor `inputQuota`, so its hook return omits `measureInput` and `inputQuota`.

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

## Imperative creators

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

Each `create*` mirrors the hook lifecycle exactly: same `UnsupportedError` / `UnavailableError` / `NoUserActivationError` conditions, same progress wiring. The returned instance is `AsyncDisposable` — prefer `await using` so the instance is released on scope exit. `.destroy()` is still exposed for callers that need to release the model earlier. Each creator accepts the same options as its hook plus an optional `signal` that cancels both the download (if any) and the underlying `create()` call.

Because a creator requires a user activation when a download is needed, prefer calling it from an event handler — or pre-warm the model via the matching hook elsewhere in the tree before the call site is reached.

## Download progress

- **Per-instance** — read `progress` and `status` from the hook return (or the creator's lifecycle, which writes to the same place). This is the right signal for "this specific translator/rewriter/proofreader is downloading."
- **Cross-instance** — `useGlobalDownloadProgress(namespace?)` reports the highest in-flight progress across every instance, regardless of which component (or imperative caller) initiated the download. Pass a namespace (`"Translator"`, `"Rewriter"`, `"Proofreader"`) to scope to one API, or call with no argument to aggregate across all built-in AI downloads. Useful for a global indicator that lives outside any specific hook call site.

```tsx
function GlobalDownloadBar() {
  const progress = useGlobalDownloadProgress();
  if (progress === 0) return null;
  return <ProgressBar value={progress} />;
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

## Capability check

`isSupported(name)` — `true` when the matching global (`"Translator"`, `"Rewriter"`, `"Proofreader"`) is present. Combine with the hook's `status` (`"unavailable"`) for the full readiness picture.

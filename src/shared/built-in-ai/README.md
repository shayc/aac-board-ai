# `built-in-ai`

Six React hooks over Chrome's built-in AI: `useSummarizer`, `useWriter`,
`useRewriter`, `useTranslator`, `useLanguageDetector`, `useProofreader`.

Import from the folder root:

```ts
import { useSummarizer } from "@shared/built-in-ai";
```

## Lifecycle

Every hook exposes the same lifecycle surface:

```ts
const { status, progress, error, prepare } = useSummarizer({ type: "tldr" });
```

`status` walks through `"unsupported" | "unavailable" | "idle" | "downloading"
| "ready" | "error"`. When the model is already available the hook auto-creates
the instance and arrives at `"ready"`. When a download is required the hook
stays at `"idle"` until `prepare()` (or any action method) is called from a
user activation — then `status` advances to `"downloading"` and `progress`
ticks from `0` to `1`.

## Acting

Action methods are gated by the lifecycle: they will throw an
`UnsupportedError`, `UnavailableError`, `NoUserActivationError`, or
`NotReadyError` when the state forbids them. A rejected call never mutates
the hook's `status` or `error`.

```tsx
function Demo() {
  const s = useSummarizer({ length: "short" });

  if (s.status === "unsupported") return <p>Not supported.</p>;
  if (s.status === "unavailable") return <p>Not available.</p>;

  return (
    <button
      disabled={s.status === "downloading"}
      onClick={async () => {
        const out = await s.summarize("…long text…");
        console.log(out);
      }}
    >
      {s.status === "ready"
        ? "Summarize"
        : `Prepare (${(s.progress * 100) | 0}%)`}
    </button>
  );
}
```

Streaming:

```ts
for await (const chunk of s.summarizeStream(text, { signal })) {
  emit(chunk);
}
```

## Options

Options are compared by shallow per-key equality. Memoize array-valued options
(`expectedInputLanguages`, etc.) to avoid spurious re-creation. Changing any
option destroys the current instance, aborts in-flight work with `AbortError`,
and re-enters the state machine.

## Errors

All thrown errors are `instanceof BuiltInAIError`. When the underlying browser
API rejects, the hook's `error.cause` is the original error.

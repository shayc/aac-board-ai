import { abortError } from "./signal.ts";

export async function* streamChunks(
  stream: ReadableStream<string>,
  signal: AbortSignal,
): AsyncIterable<string> {
  if (signal.aborted) {
    throw abortError(signal.reason);
  }
  const reader = stream.getReader();
  const onAbort = () => {
    void reader.cancel(signal.reason).catch(() => undefined);
  };
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (signal.aborted) {
        throw abortError(signal.reason);
      }
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    signal.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }
}

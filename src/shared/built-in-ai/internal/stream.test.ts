import { describe, expect, test } from "vitest";
import { streamChunks } from "./stream.ts";

function streamFromChunks(chunks: readonly string[]): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(c);
      }
      controller.close();
    },
  });
}

async function collect(it: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const chunk of it) {
    out.push(chunk);
  }
  return out;
}

describe("streamChunks", () => {
  test("yields all chunks from a ReadableStream in order", async () => {
    const stream = streamFromChunks(["a", "b", "c"]);
    const { signal } = new AbortController();
    expect(await collect(streamChunks(stream, signal))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("releases the reader lock after the stream drains", async () => {
    const stream = streamFromChunks(["only"]);
    const { signal } = new AbortController();
    await collect(streamChunks(stream, signal));
    expect(stream.locked).toBe(false);
  });

  test("throws an AbortError when the signal is already aborted on entry", async () => {
    const stream = streamFromChunks(["a", "b"]);
    const controller = new AbortController();
    controller.abort();

    const iter = streamChunks(stream, controller.signal)[
      Symbol.asyncIterator
    ]();
    await expect(iter.next()).rejects.toMatchObject({ name: "AbortError" });
  });

  test("cancels the underlying source and releases the lock when the signal aborts mid-stream", async () => {
    let cancelReason: unknown = "<<never>>";
    const stream = new ReadableStream<string>({
      start(controller) {
        controller.enqueue("first");
      },
      pull() {
        return new Promise<void>(() => undefined);
      },
      cancel(reason) {
        cancelReason = reason;
      },
    });
    const controller = new AbortController();
    const iter = streamChunks(stream, controller.signal)[
      Symbol.asyncIterator
    ]();

    expect((await iter.next()).value).toBe("first");

    const reason = new DOMException("done", "AbortError");
    const secondNext = iter.next();
    controller.abort(reason);

    await expect(secondNext).rejects.toMatchObject({ name: "AbortError" });
    expect(cancelReason).toBe(reason);
    expect(stream.locked).toBe(false);
  });
});

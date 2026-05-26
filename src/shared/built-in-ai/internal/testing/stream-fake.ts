/** `ReadableStream<string>` that emits `chunks` in order then closes. */
export function makeChunkStream(
  chunks: readonly string[],
): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(c);
      }
      controller.close();
    },
  });
}

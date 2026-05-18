import { vi, type Mock } from "vitest";

export interface AIFake<I> {
  Fake: { availability: Mock; create: Mock };
  availability: Mock;
  create: Mock;
  instances: I[];
}

export interface MakeAIFakeOptions<I> {
  status?: Availability;
  buildInstance: () => I;
  failCreate?: Error;
}

/**
 * Minimal fake for any built-in AI namespace. Tests needing exotic timing
 * (manual create resolution, monitor wiring, mid-create option swaps) should
 * compose their fakes inline — this factory only covers the common path.
 */
export function makeAIFake<I>({
  status = "available",
  buildInstance,
  failCreate,
}: MakeAIFakeOptions<I>): AIFake<I> {
  const instances: I[] = [];
  const availability = vi.fn(() => Promise.resolve(status));
  const create = vi.fn(() => {
    if (failCreate) {
      return Promise.reject(failCreate);
    }
    const inst = buildInstance();
    instances.push(inst);
    return Promise.resolve(inst);
  });
  return {
    Fake: { availability, create },
    availability,
    create,
    instances,
  };
}

/**
 * Build a `ReadableStream<string>` that emits the given chunks then closes.
 * Used by streaming instance fakes so `streamChunks` is exercised end-to-end.
 */
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

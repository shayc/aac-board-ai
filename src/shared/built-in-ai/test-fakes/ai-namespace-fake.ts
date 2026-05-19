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
 * Minimal fake for any built-in AI namespace — common path only. Tests needing
 * exotic timing (manual create resolution, monitor wiring, etc.) compose inline.
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

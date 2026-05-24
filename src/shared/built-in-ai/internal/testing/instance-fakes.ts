import { vi } from "vitest";
import { makeChunkStream } from "./ai-namespace-fake";

export function buildTranslatorInstance() {
  return {
    translate: vi.fn((input: string) => Promise.resolve(`T:${input}`)),
    translateStreaming: vi.fn(() => makeChunkStream(["T:", "hello"])),
    measureInputUsage: vi.fn(() => Promise.resolve(7)),
    inputQuota: 1024,
    destroy: vi.fn<() => void>(),
  };
}

export function buildRewriterInstance() {
  return {
    rewrite: vi.fn((input: string, opts?: RewriterRewriteOptions) =>
      Promise.resolve(`R(${opts?.context ?? ""}):${input}`),
    ),
    rewriteStreaming: vi.fn(() => makeChunkStream(["R:", "alt"])),
    measureInputUsage: vi.fn(() => Promise.resolve(4)),
    inputQuota: 768,
    destroy: vi.fn<() => void>(),
  };
}

export function buildProofreaderInstance() {
  return {
    proofread: vi.fn((input: string) =>
      Promise.resolve({
        correctedInput: `corrected(${input})`,
        corrections: [
          {
            startIndex: 0,
            endIndex: 5,
            correction: "Hello",
            types: ["capitalization" as const],
          },
        ],
      }),
    ),
    destroy: vi.fn<() => void>(),
  };
}

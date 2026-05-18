import { vi } from "vitest";
import { makeChunkStream } from "./ai-namespace-fake.ts";

// Context-bearing fakes echo `context` into their output so tests can prove
// the option was forwarded without inspecting mock.calls.
interface ContextOpts {
  context?: string;
}

export function buildTranslatorInstance() {
  return {
    translate: vi.fn((input: string) => Promise.resolve(`T:${input}`)),
    translateStreaming: vi.fn(() => makeChunkStream(["T:", "hello"])),
    measureInputUsage: vi.fn(() => Promise.resolve(7)),
    inputQuota: 1024,
    destroy: vi.fn<() => void>(),
  };
}

export function buildSummarizerInstance() {
  return {
    summarize: vi.fn((input: string, opts?: ContextOpts) =>
      Promise.resolve(`S(${opts?.context ?? ""}):${input}`),
    ),
    summarizeStreaming: vi.fn(() => makeChunkStream(["S:", "sum"])),
    measureInputUsage: vi.fn(() => Promise.resolve(3)),
    inputQuota: 2048,
    destroy: vi.fn<() => void>(),
  };
}

export function buildWriterInstance() {
  return {
    write: vi.fn((input: string, opts?: ContextOpts) =>
      Promise.resolve(`W(${opts?.context ?? ""}):${input}`),
    ),
    writeStreaming: vi.fn(() => makeChunkStream(["W:", "out"])),
    measureInputUsage: vi.fn(() => Promise.resolve(5)),
    inputQuota: 512,
    destroy: vi.fn<() => void>(),
  };
}

export function buildRewriterInstance() {
  return {
    rewrite: vi.fn((input: string, opts?: ContextOpts) =>
      Promise.resolve(`R(${opts?.context ?? ""}):${input}`),
    ),
    rewriteStreaming: vi.fn(() => makeChunkStream(["R:", "alt"])),
    measureInputUsage: vi.fn(() => Promise.resolve(4)),
    inputQuota: 768,
    destroy: vi.fn<() => void>(),
  };
}

export function buildLanguageDetectorInstance() {
  return {
    detect: vi.fn(() =>
      Promise.resolve([
        { detectedLanguage: "en", confidence: 0.9 },
        { detectedLanguage: "fr", confidence: 0.1 },
      ]),
    ),
    measureInputUsage: vi.fn(() => Promise.resolve(2)),
    inputQuota: 256,
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

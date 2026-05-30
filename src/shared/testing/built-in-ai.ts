import { type Mock, vi } from "vitest";

// Stubs the browser Built-in AI globals (Proofreader/Rewriter/Translator) that
// @shayc/react-built-in-ai reads off globalThis. These APIs are absent in CI
// Chromium and back a multi-gigabyte on-device model, so we replace them at the
// global boundary and let the real library hooks and lifecycle run against a
// fake model. availability() resolves "available", so the lifecycle provisions
// silently (idle → ready) with no download or user-activation gate. Vitest's
// `unstubGlobals` config restores the globals before each test.

type AINamespace = "Proofreader" | "Rewriter" | "Translator";

interface NamespaceSpies {
  create: Mock<(options?: Record<string, unknown>) => Promise<unknown>>;
  availability: Mock<
    (options?: Record<string, unknown>) => Promise<Availability>
  >;
}

export interface ProofreaderStub extends NamespaceSpies {
  proofread: Mock<
    (input: string) => ProofreadResult | Promise<ProofreadResult>
  >;
}

export interface RewriterStub extends NamespaceSpies {
  rewrite: Mock<(input: string) => string | Promise<string>>;
}

export interface TranslatorStub extends NamespaceSpies {
  translate: Mock<(input: string) => string | Promise<string>>;
}

function installNamespace(
  name: AINamespace,
  buildInstance: () => Record<string, unknown>,
): NamespaceSpies {
  const availability = vi.fn<
    (options?: Record<string, unknown>) => Promise<Availability>
  >(() => Promise.resolve("available"));

  const create = vi.fn<(options?: Record<string, unknown>) => Promise<unknown>>(
    () => Promise.resolve({ destroy: () => undefined, ...buildInstance() }),
  );

  vi.stubGlobal(name, { availability, create });

  return { create, availability };
}

export function makeProofreadResult(correctedInput: string): ProofreadResult {
  return { correctedInput, corrections: [] };
}

export function stubProofreader(
  proofread: (
    input: string,
  ) => ProofreadResult | Promise<ProofreadResult> = makeProofreadResult,
): ProofreaderStub {
  const action = vi.fn(proofread);
  const spies = installNamespace("Proofreader", () => ({ proofread: action }));

  return { proofread: action, ...spies };
}

export function stubRewriter(
  rewrite: (input: string) => string | Promise<string> = (input) => input,
): RewriterStub {
  const action = vi.fn(rewrite);
  const spies = installNamespace("Rewriter", () => ({ rewrite: action }));

  return { rewrite: action, ...spies };
}

export function stubTranslator(
  translate: (input: string) => string | Promise<string> = (input) => input,
): TranslatorStub {
  const action = vi.fn(translate);
  const spies = installNamespace("Translator", () => ({ translate: action }));

  return { translate: action, ...spies };
}

export function stubBuiltInAIUnsupported(...names: AINamespace[]): void {
  for (const name of names) {
    vi.stubGlobal(name, undefined);
  }
}

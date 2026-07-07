import { type Mock, vi } from "vitest";

// Stubs the Built-in AI globals (Proofreader/Rewriter/Translator) that
// @shayc/react-built-in-ai reads off globalThis. They're absent in CI Chromium,
// so we fake them at the global boundary.

type AINamespace = "Proofreader" | "Rewriter" | "Translator" | "LanguageModel";

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

export interface LanguageModelStub extends NamespaceSpies {
  prompt: Mock<(input: string) => string | Promise<string>>;
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

// The Prompt API session exposes the surface @shayc/react-built-in-ai reads:
// `prompt`, the `contextoverflow` listener, and the live context-window numbers.
export function stubLanguageModel(
  prompt: (input: string) => string | Promise<string> = () => '{"words":[]}',
): LanguageModelStub {
  const action = vi.fn(prompt);
  const spies = installNamespace("LanguageModel", () => ({
    prompt: action,
    addEventListener: () => undefined,
    contextWindow: 4096,
    contextUsage: 0,
  }));

  return { prompt: action, ...spies };
}

export function stubBuiltInAIUnsupported(...names: AINamespace[]): void {
  for (const name of names) {
    vi.stubGlobal(name, undefined);
  }
}

import { type Mock, vi } from "vitest";

type AINamespace = "LanguageModel" | "Proofreader" | "Rewriter" | "Translator";

interface NamespaceSpies {
  create: Mock<(options?: Record<string, unknown>) => Promise<unknown>>;
  availability: Mock<
    (options?: Record<string, unknown>) => Promise<Availability>
  >;
}

interface ProofreaderStub extends NamespaceSpies {
  proofread: Mock<
    (input: string) => ProofreadResult | Promise<ProofreadResult>
  >;
}

interface RewriterStub extends NamespaceSpies {
  rewrite: Mock<(input: string) => string | Promise<string>>;
}

interface LanguageModelStub extends NamespaceSpies {
  prompt: Mock<(input: unknown) => string | Promise<string>>;
}

interface TranslatorStub extends NamespaceSpies {
  translate: Mock<(input: string) => string | Promise<string>>;
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

export function stubLanguageModel(
  prompt: (input: unknown) => string | Promise<string>,
): LanguageModelStub {
  const action = vi.fn(prompt);
  const spies = installNamespace("LanguageModel", () =>
    languageModelSession(action),
  );

  return { prompt: action, ...spies };
}

export function stubTranslator(
  translate: (input: string) => string | Promise<string> = (input) => input,
): TranslatorStub {
  const action = vi.fn(translate);
  const spies = installNamespace("Translator", () => ({ translate: action }));

  return { translate: action, ...spies };
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

function languageModelSession(
  prompt: LanguageModelStub["prompt"],
): Record<string, unknown> {
  return {
    prompt,
    clone: () => Promise.resolve(languageModelSession(prompt)),
    destroy: () => undefined,
    addEventListener: () => undefined,
    contextUsage: 0,
    contextWindow: 9216,
  };
}

export interface BuiltInAINamespaces {
  Translator: typeof Translator;
  Rewriter: typeof Rewriter;
  Proofreader: typeof Proofreader;
  Summarizer: typeof Summarizer;
  Writer: typeof Writer;
  LanguageDetector: typeof LanguageDetector;
}

export type BuiltInAIName = keyof BuiltInAINamespaces;

/** True when `name`'s global namespace exists and is defined. */
export function isSupported(name: BuiltInAIName): boolean {
  return (globalThis as Record<string, unknown>)[name] != null;
}

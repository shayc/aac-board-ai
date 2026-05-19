export type BuiltInAIName =
  | "Translator"
  | "Rewriter"
  | "Proofreader"
  | "Summarizer"
  | "Writer"
  | "LanguageDetector";

/** True when `name`'s global namespace exists and is defined. */
export function isSupported(name: BuiltInAIName): boolean {
  return (globalThis as Record<string, unknown>)[name] != null;
}

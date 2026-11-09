import { createTranslator } from "@shayc/react-built-in-ai";

interface TranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
  signal: AbortSignal;
}

export async function withTranslator<T>(
  options: TranslatorOptions,
  run: (translator: Translator) => Promise<T>,
): Promise<T> {
  const translator = await createTranslator(options);

  try {
    return await run(translator);
  } finally {
    translator.destroy();
  }
}

export async function translateStrings(
  strings: Iterable<string>,
  translator: Translator,
  signal: AbortSignal,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Array.from(strings, async (text) => {
      const translated = await translator.translate(text, { signal });

      return [text, translated] as const;
    }),
  );

  return Object.fromEntries(entries);
}

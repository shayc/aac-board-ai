import { checkAvailability, createTranslator } from "@shayc/react-built-in-ai";
import { areLanguagesCompatible } from "./board-translations";

/** Call directly from language selection, before any storage reads lose activation. */
export async function prepareBoardLanguage(
  sourceLanguages: readonly string[],
  targetLanguage: string,
  signal: AbortSignal,
): Promise<boolean> {
  const pairs = sourceLanguages.filter(
    (sourceLanguage) => !areLanguagesCompatible(sourceLanguage, targetLanguage),
  );
  const results = await Promise.allSettled(
    pairs.map(async (sourceLanguage) => {
      const options = { sourceLanguage, targetLanguage };
      const availability = await checkAvailability("Translator", options);
      signal.throwIfAborted();
      if (availability !== "downloadable" && availability !== "downloading") {
        return false;
      }

      const translator = await createTranslator({ ...options, signal });
      translator.destroy();
      return true;
    }),
  );

  return results.some(
    (result) => result.status === "fulfilled" && result.value,
  );
}

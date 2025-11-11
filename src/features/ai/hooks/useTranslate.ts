import {
  isAvailable,
  translate,
  type LanguageCode,
} from "@features/ai/aiService";
import { useAsyncOperation } from "./useAsyncOperation";

/**
 * Hook for translating text to a target language
 *
 * Wraps the aiService.translate function with async state management
 */
export function useTranslate() {
  const available = isAvailable("translator");

  const operation = useAsyncOperation<
    string,
    [string, LanguageCode, LanguageCode?]
  >(async (signal, text, targetLang, sourceLang) => {
    return translate(text, targetLang, sourceLang, signal);
  });

  return {
    available,
    ...operation,
  };
}

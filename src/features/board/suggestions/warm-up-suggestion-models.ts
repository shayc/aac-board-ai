import { getStoredLanguage } from "@shared/language/language-store";
import {
  createProofreader,
  createRewriter,
  isSupported,
} from "@shayc/react-built-in-ai";

// Chrome only starts a model download from a user gesture, so this runs in
// click handlers the user is guaranteed to hit (onboarding's Continue). It's
// an opportunistic prefetch: failures stay silent because the suggestion
// bar's own status is the user-facing surface.
export function warmUpSuggestionModels(): void {
  const language = getStoredLanguage();

  if (isSupported("Proofreader")) {
    void createProofreader({ expectedInputLanguages: [language] })
      .then((proofreader) => proofreader.destroy())
      .catch(() => undefined);
  }

  if (isSupported("Rewriter")) {
    void createRewriter({
      expectedInputLanguages: [language],
      expectedContextLanguages: [language],
      outputLanguage: language,
    })
      .then((rewriter) => rewriter.destroy())
      .catch(() => undefined);
  }
}

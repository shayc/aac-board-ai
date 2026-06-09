import { getStoredLanguage } from "@shared/language/language-store";
import {
  createProofreader,
  createRewriter,
  isSupported,
} from "@shayc/react-built-in-ai";
import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "./engine-language-options";

// Chrome only starts a model download from a user gesture, so this runs in
// click handlers the user is guaranteed to hit (onboarding's Continue). It's
// an opportunistic prefetch: failures stay silent because the suggestion
// bar's own status is the user-facing surface.
export function warmUpSuggestionModels(): void {
  const language = getStoredLanguage();

  if (isSupported("Proofreader")) {
    void createProofreader(proofreaderLanguageOptions(language))
      .then((proofreader) => proofreader.destroy())
      .catch(() => undefined);
  }

  if (isSupported("Rewriter")) {
    void createRewriter(rewriterLanguageOptions(language))
      .then((rewriter) => rewriter.destroy())
      .catch(() => undefined);
  }
}

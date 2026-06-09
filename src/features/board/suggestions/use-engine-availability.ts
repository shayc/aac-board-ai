import { isSupported } from "@shayc/react-built-in-ai";
import { useEffect, useState } from "react";
import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "./engine-language-options";

export type SuggestionEngineName = "Proofreader" | "Rewriter";

// The lifecycle hooks idle indefinitely when the model needs a download (only
// a user gesture may start one), and their snapshot can't tell that apart
// from a probe still in flight. This probe makes "downloadable" observable so
// the UI can offer the gesture.
export function useEngineAvailability(
  name: SuggestionEngineName,
  language: string,
): Availability | undefined {
  const [availability, setAvailability] = useState<Availability | undefined>(
    () => (isSupported(name) ? undefined : "unavailable"),
  );

  useEffect(() => {
    if (!isSupported(name)) {
      return;
    }

    let cancelled = false;

    const probe =
      name === "Proofreader"
        ? Proofreader.availability(proofreaderLanguageOptions(language))
        : Rewriter.availability(rewriterLanguageOptions(language));

    probe
      .then((value) => {
        if (!cancelled) {
          setAvailability(value);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [name, language]);

  return availability;
}

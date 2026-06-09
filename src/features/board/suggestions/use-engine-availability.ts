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
interface ProbeResult {
  name: SuggestionEngineName;
  language: string;
  value: Availability;
}

export function useEngineAvailability(
  name: SuggestionEngineName,
  language: string,
): Availability | undefined {
  const [probe, setProbe] = useState<ProbeResult | null>(null);

  useEffect(() => {
    if (!isSupported(name)) {
      return;
    }

    let cancelled = false;

    const request =
      name === "Proofreader"
        ? Proofreader.availability(proofreaderLanguageOptions(language))
        : Rewriter.availability(rewriterLanguageOptions(language));

    request
      .then((value) => {
        if (!cancelled) {
          setProbe({ name, language, value });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [name, language]);

  if (!isSupported(name)) {
    return "unavailable";
  }

  // An answer probed for another (name, language) is stale, not an answer.
  return probe?.name === name && probe.language === language
    ? probe.value
    : undefined;
}

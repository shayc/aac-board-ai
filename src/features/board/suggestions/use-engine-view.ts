import {
  isSupported,
  MissingUserActivationError,
  type BaseHookReturn,
} from "@shayc/react-built-in-ai";
import { useEffect, useState } from "react";
import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "./engine-language-options";

export type SuggestionEngineName = "Proofreader" | "Rewriter";

export type EngineView =
  | { kind: "ready" }
  | { kind: "downloading"; progress: number }
  | { kind: "awaits-gesture" }
  | { kind: "initializing" }
  | { kind: "unavailable" }
  | { kind: "unsupported" };

export type EngineSnapshot = Pick<
  BaseHookReturn,
  "status" | "progress" | "error"
>;

// Interprets the library lifecycle for humans. The lifecycle idles
// indefinitely when a download awaits the gesture Chrome requires, so the
// availability probe disambiguates idle: downloadable means parked on the
// user, anything else means still coming up.
export function deriveEngineView(
  engine: EngineSnapshot,
  availability: Availability | undefined,
): EngineView {
  switch (engine.status) {
    case "unsupported":
      return { kind: "unsupported" };
    case "ready":
      return { kind: "ready" };
    case "downloading":
      return { kind: "downloading", progress: engine.progress };
    case "unavailable":
      return { kind: "unavailable" };
    case "error":
      return engine.error instanceof MissingUserActivationError
        ? { kind: "awaits-gesture" }
        : { kind: "unavailable" };
    case "idle":
      return availability === "downloadable"
        ? { kind: "awaits-gesture" }
        : { kind: "initializing" };
  }
}

export function useEngineView(
  name: SuggestionEngineName,
  language: string,
  engine: EngineSnapshot,
): EngineView {
  const availability = useEngineAvailability(name, language);

  return deriveEngineView(engine, availability);
}

interface ProbeResult {
  name: SuggestionEngineName;
  language: string;
  value: Availability;
}

function useEngineAvailability(
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

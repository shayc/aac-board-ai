import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useProofreader } from "@shayc/react-built-in-ai";
import { type SuggestionSource, toSuggestionSource } from "./suggestion-source";

interface UseProofreaderSourceOptions {
  text: string;
  language: string;
}

export function useProofreaderSource({
  text,
  language,
}: UseProofreaderSourceOptions): SuggestionSource {
  const proofreader = useProofreader({
    expectedInputLanguages: [language],
  });

  const canProofread = text !== "" && proofreader.status === "ready";
  const request = useLatestAsync({
    deps: [text, language],
    run: canProofread
      ? (signal) =>
          proofreader
            .proofread(text, { signal })
            .then((result) => result.correctedInput)
      : undefined,
  });

  return toSuggestionSource(proofreader, request);
}

import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { type Status, useLanguageModel } from "@shayc/react-built-in-ai";
import { useEffect, useRef } from "react";
import { continuationLanguageOptions } from "./continuation-prompt";
import {
  predictContinuations,
  prepareContinuations,
} from "./continuation-session";

interface UseContinuationSourceOptions {
  text: string;
  vocabulary: readonly string[];
  isWordOpen: boolean;
  language: string;
}

export interface ContinuationSource {
  engineStatus: Status;
  continuations: readonly (readonly string[])[];
  isRequestPending: boolean;
  hasRequestFailed: boolean;
  enable: () => void;
}

export function useContinuationSource({
  text,
  vocabulary,
  isWordOpen,
  language,
}: UseContinuationSourceOptions): ContinuationSource {
  // The hook's own session only tracks availability, download and enabling;
  // predictions run on a per-board session that supports cloning.
  const engine = useLanguageModel(continuationLanguageOptions(language));

  // The hook keeps the options it mounted with, so a new language needs a
  // fresh session for the status to describe it.
  const engineLanguage = useRef(language);
  useEffect(() => {
    if (engineLanguage.current === language) {
      return;
    }

    engineLanguage.current = language;
    engine.reset(continuationLanguageOptions(language));
  }, [engine, language]);

  const canUseBoard = vocabulary.length > 0 && engine.status === "ready";
  useEffect(() => {
    if (canUseBoard) {
      prepareContinuations({ vocabulary, language });
    }
  }, [canUseBoard, vocabulary, language]);

  // A word still being spelled is not a word to follow yet.
  const canPredict = canUseBoard && text !== "" && !isWordOpen;
  const request = useLatestAsync({
    deps: [text, language, ...vocabulary],
    run: canPredict
      ? (signal) => predictContinuations({ text, vocabulary, language, signal })
      : undefined,
  });

  function enable() {
    // Engine status exposes preparation failures to the UI.
    void engine.prepare().catch(() => undefined);
  }

  return {
    engineStatus: engine.status,
    continuations: request.value ?? [],
    isRequestPending: request.isPending,
    hasRequestFailed:
      request.error !== undefined && request.error.name !== "AbortError",
    enable,
  };
}

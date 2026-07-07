import { languageModelLanguageOptions } from "@shared/built-in-ai/engine-language-options";
import { prepareQuietly } from "@shared/built-in-ai/prepare-quietly";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import { type Status, useLanguageModel } from "@shayc/react-built-in-ai";
import { useEffect, useRef } from "react";
import type { Board } from "../types";
import { getBoardWords } from "./get-board-words";
import {
  buildPredictionPrompt,
  PREDICTION_RESPONSE_SCHEMA,
  PREDICTION_SYSTEM_PROMPT,
} from "./prediction-prompt";
import { toPredictedWords } from "./to-predicted-words";

const PREDICTION_DEBOUNCE_MS = 400;

export interface UseWordPredictionReturn {
  status: Status;
  requestFailed: boolean;
  isPending: boolean;
  phrase: string | undefined;
  enable: () => void;
}

function isNonAbortError(error: Error | undefined): boolean {
  return error !== undefined && error.name !== "AbortError";
}

function sessionOptions(language: string) {
  const initialPrompts: [LanguageModelSystemMessage] = [
    { role: "system", content: PREDICTION_SYSTEM_PROMPT },
  ];

  return { initialPrompts, ...languageModelLanguageOptions(language) };
}

// Predicts the next 1–3 words for the message being composed, constrained to
// the visible board's words.
export function useWordPrediction(
  text: string,
  board: Board,
): UseWordPredictionReturn {
  const { language } = useLanguage();
  const boardWords = getBoardWords(board);

  // Options are captured once at mount (the library's session contract), so the
  // system prompt survives resets. The session is held in a ref so the
  // re-provisioning effects can call reset() without re-reading mount options.
  const model = useLanguageModel(sessionOptions(language));

  const modelRef = useRef(model);
  useEffect(() => {
    modelRef.current = model;
  });

  const languageRef = useRef(language);
  useEffect(() => {
    if (languageRef.current === language) {
      return;
    }
    languageRef.current = language;
    modelRef.current.reset(sessionOptions(language));
  }, [language]);

  // A per-call reset is deliberately avoided — it races the library's session
  // swap. `reset()` reuses the current options, costing at most one harmless
  // re-prediction.
  useEffect(() => {
    const overflowed = model.overflowCount > 0;
    const halfFull =
      model.contextWindow > 0 && model.contextUsage > model.contextWindow / 2;
    if (overflowed || halfFull) {
      modelRef.current.reset();
    }
  }, [model.overflowCount, model.contextUsage, model.contextWindow]);

  const debouncedText = useDebouncedValue(text, PREDICTION_DEBOUNCE_MS);

  const prediction = useLatestAsync({
    enabled: model.status === "ready" && boardWords.length > 0,
    deps: [debouncedText, boardWords.join("\0"), language],
    fetch: (signal) =>
      model
        .prompt(buildPredictionPrompt(debouncedText, boardWords), {
          responseConstraint: PREDICTION_RESPONSE_SCHEMA,
          signal,
        })
        .then((rawResponse) =>
          toPredictedWords({
            rawResponse,
            boardWords,
            messageText: debouncedText,
          }),
        ),
  });

  const enable = () => {
    if (model.status === "downloadable") {
      prepareQuietly(model);
    }
  };

  // Only show the prediction while live text still matches the debounced text
  // it was predicted for, so a half-typed sentence never shows a continuation
  // predicted for an older prefix.
  const words = prediction.value ?? [];
  const phrase =
    words.length > 0 && text === debouncedText
      ? [debouncedText.trim(), ...words].filter(Boolean).join(" ")
      : undefined;

  return {
    status: model.status,
    requestFailed: isNonAbortError(prediction.error),
    isPending: prediction.isPending,
    phrase,
    enable,
  };
}

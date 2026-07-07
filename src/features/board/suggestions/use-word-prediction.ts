import { languageModelLanguageOptions } from "@shared/built-in-ai/engine-language-options";
import { prepareQuietly } from "@shared/built-in-ai/prepare-quietly";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import { type Status, useLanguageModel } from "@shayc/react-built-in-ai";
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

// Predicts the next 1–3 words for the message being composed, constrained to
// the visible board's words.
export function useWordPrediction(
  text: string,
  board: Board,
): UseWordPredictionReturn {
  const { language } = useLanguage();
  const boardWords = getBoardWords(board);

  const model = useLanguageModel({
    initialPrompts: [{ role: "system", content: PREDICTION_SYSTEM_PROMPT }],
    ...languageModelLanguageOptions(language),
  });

  const debouncedText = useDebouncedValue(text, PREDICTION_DEBOUNCE_MS);
  const hasText = debouncedText.trim().length > 0;

  const prediction = useLatestAsync({
    enabled: model.status === "ready" && hasText && boardWords.length > 0,
    deps: [debouncedText, boardWords.join("\0")],
    fetch: (signal: AbortSignal) =>
      model
        .prompt(buildPredictionPrompt(debouncedText, boardWords), {
          responseConstraint: PREDICTION_RESPONSE_SCHEMA,
          signal,
        })
        .then((rawResponse) => toPredictedWords({ rawResponse, boardWords })),
  });

  const enable = () => {
    if (model.status === "downloadable") {
      prepareQuietly(model);
    }
  };

  const words = prediction.value ?? [];
  const phrase =
    words.length > 0 ? [debouncedText.trim(), ...words].join(" ") : undefined;

  return {
    status: model.status,
    requestFailed: isNonAbortError(prediction.error),
    isPending: prediction.isPending,
    phrase,
    enable,
  };
}

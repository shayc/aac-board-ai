import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { createTranslator, isSupported } from "@shayc/react-built-in-ai";
import { useEffect, useRef, useState } from "react";

interface BoardTranslationPreparationProps {
  sourceLanguages: readonly string[];
  targetLanguage: string;
  onReady: () => void;
}

export function BoardTranslationPreparation({
  sourceLanguages,
  targetLanguage,
  onReady,
}: BoardTranslationPreparationProps) {
  const t = useTranslate();
  const controllerRef = useRef<AbortController | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function prepare() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsPreparing(true);
    setHasFailed(false);

    // Pairs are already known, so each creation starts in the activation handler.
    const results = await Promise.allSettled(
      sourceLanguages.map(async (sourceLanguage) => {
        const translator = await createTranslator({
          sourceLanguage,
          targetLanguage,
          signal: controller.signal,
        });
        translator.destroy();
      }),
    );

    if (controller.signal.aborted) {
      return;
    }
    setIsPreparing(false);
    setHasFailed(results.some((result) => result.status === "rejected"));
    if (results.some((result) => result.status === "fulfilled")) {
      onReady();
    }
  }

  if (sourceLanguages.length === 0 || !isSupported("Translator")) {
    return null;
  }

  return (
    <Stack spacing={1}>
      <Button
        loading={isPreparing}
        variant="outlined"
        onClick={() => void prepare()}
      >
        {t(m.boardTranslationPrepare)}
      </Button>
      {hasFailed && (
        <Typography
          role="status"
          sx={{ typography: "body2", color: "text.secondary" }}
        >
          {t(m.boardTranslationPrepareFailed)}
        </Typography>
      )}
    </Stack>
  );
}

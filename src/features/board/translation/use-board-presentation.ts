import { useLanguage } from "@shared/language/use-language";
import { useEffect, useState } from "react";
import type { Board } from "../types";
import { findTranslatedBoard } from "./board-strings";
import { resolveTranslatedBoard } from "./resolve-translated-board";

interface BoardPresentation {
  sourceBoard: Board;
  setId: string | undefined;
  targetLanguage: string;
  board: Board;
  isLocked: boolean;
}

function createPresentation(
  sourceBoard: Board,
  setId: string | undefined,
  targetLanguage: string,
): BoardPresentation {
  return {
    sourceBoard,
    setId,
    targetLanguage,
    board: findTranslatedBoard(sourceBoard, targetLanguage) ?? sourceBoard,
    isLocked: false,
  };
}

export function useBoardPresentation(
  sourceBoard: Board,
  setId: string | undefined,
) {
  const { language } = useLanguage();
  const [presentation, setPresentation] = useState(() =>
    createPresentation(sourceBoard, setId, language),
  );

  if (
    presentation.sourceBoard !== sourceBoard ||
    presentation.setId !== setId ||
    presentation.targetLanguage !== language
  ) {
    setPresentation(createPresentation(sourceBoard, setId, language));
  }

  useEffect(() => {
    if (setId === undefined || findTranslatedBoard(sourceBoard, language)) {
      return;
    }

    const controller = new AbortController();
    void resolveTranslatedBoard(
      setId,
      sourceBoard,
      language,
      controller.signal,
    ).then((board) => {
      if (controller.signal.aborted) {
        return;
      }

      setPresentation((current) => {
        if (
          current.sourceBoard !== sourceBoard ||
          current.setId !== setId ||
          current.targetLanguage !== language ||
          current.isLocked
        ) {
          return current;
        }

        return { ...current, board };
      });
    });

    return () => controller.abort();
  }, [sourceBoard, setId, language]);

  function lockPresentation() {
    // Focus also locks the labels: changing a focused control's name beneath
    // assistive technology would make the current interaction unpredictable.
    setPresentation((current) =>
      current.isLocked ? current : { ...current, isLocked: true },
    );
  }

  return { board: presentation.board, lockPresentation };
}

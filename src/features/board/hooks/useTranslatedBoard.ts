import type { Board } from "@features/board/types";
import { useTranslator } from "@shared/hooks/ai/useTranslator";
import { useEffect, useState } from "react";

export interface TranslatedBoardOptions {
  board: Board | null;
  languageCode: string;
}

export function useTranslatedBoard({
  board,
  languageCode,
}: TranslatedBoardOptions): Board | null {
  const { createTranslator } = useTranslator();
  const [translatedBoard, setTranslatedBoard] = useState<Board | null>(null);

  useEffect(() => {
    const translateBoard = async () => {
      if (!board) {
        return;
      }

      if (languageCode.includes("en")) {
        setTranslatedBoard(null);
        return;
      }

      const translator = await createTranslator({
        sourceLanguage: "en",
        targetLanguage: languageCode,
      });

      const translatedName = await translator?.translate(board.name ?? "");
      const translatedButtons = await Promise.all(
        board.buttons.map(async (button) => {
          let translatedLabel = button.label;
          if (button.label) {
            translatedLabel = await translator?.translate(button.label);
          }

          let translatedVocalization = button.vocalization;
          if (button.vocalization) {
            translatedVocalization = await translator?.translate(
              button.vocalization,
            );
          }

          return {
            ...button,
            label: translatedLabel,
            vocalization: translatedVocalization,
          };
        }),
      );

      setTranslatedBoard({
        ...board,
        name: translatedName,
        buttons: translatedButtons,
      });
    };

    void translateBoard();
  }, [languageCode, board, createTranslator]);

  return translatedBoard ?? board;
}

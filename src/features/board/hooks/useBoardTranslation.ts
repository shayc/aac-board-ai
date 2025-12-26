import type { Board } from "@features/board/types";
import { useLanguage } from "@shared/contexts/LanguageProvider/useLanguage";
import { useTranslator } from "@shared/hooks/ai/useTranslator";
import { useEffect, useState } from "react";

export interface UseBoardTranslationOptions {
  board: Board | null;
}

export interface UseBoardTranslationReturn {
  translatedBoard: Board | null;
}

export function useBoardTranslation({
  board,
}: UseBoardTranslationOptions): UseBoardTranslationReturn {
  const { languageCode } = useLanguage();
  const { createTranslator } = useTranslator();

  const [translatedBoard, setTranslatedBoard] = useState<Board | null>(null);

  useEffect(() => {
    const translatedBoard = async () => {
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

    void translatedBoard();
  }, [languageCode, board]);

  return {
    translatedBoard,
  };
}

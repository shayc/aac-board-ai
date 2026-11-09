import { BOARD_SET_SEGMENT, translateBoardSet } from "@features/board";
import { useLanguage } from "@shared/language/use-language";
import { useEffect } from "react";
import { useMatch, useRevalidator } from "react-router";

export function useTranslateActiveBoardSet(): void {
  const { language } = useLanguage();
  const { revalidate } = useRevalidator();
  const boardSetId = useMatch({ path: `/${BOARD_SET_SEGMENT}`, end: false })
    ?.params.boardSetId;

  useEffect(() => {
    if (!boardSetId) {
      return;
    }

    const controller = new AbortController();
    translateBoardSet(boardSetId, language, controller.signal)
      .then((didTranslate) => {
        if (didTranslate) {
          void revalidate();
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [boardSetId, language, revalidate]);
}

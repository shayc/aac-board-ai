import { BOARD_ROUTE_PATTERN, translateBoardSet } from "@features/board";
import { useLanguage } from "@shared/language/use-language";
import { useEffect, useEffectEvent } from "react";
import { useMatch, useRevalidator } from "react-router";

export function useTranslateActiveBoardSet(): void {
  const { language } = useLanguage();
  const { revalidate } = useRevalidator();
  const { boardSetId, boardId } = useMatch(BOARD_ROUTE_PATTERN)?.params ?? {};
  const readBoardIdOnScreen = useEffectEvent(() => boardId);

  useEffect(() => {
    if (!boardSetId) {
      return;
    }

    const controller = new AbortController();
    translateBoardSet(boardSetId, language, {
      firstBoardId: readBoardIdOnScreen(),
      signal: controller.signal,
      onBoardTranslated: () => void revalidate(),
    }).catch(() => undefined);

    return () => controller.abort();
  }, [boardSetId, language, revalidate]);
}

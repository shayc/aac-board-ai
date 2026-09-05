import type { BoardLoaderResult } from "@app/routing/loaders/board-loader";
import { BOARD_ROUTE_ID } from "@app/routing/route-ids";
import { BoardTranslationPreparation } from "@features/board";
import { useLanguage } from "@shared/language/use-language";
import { useRevalidator, useRouteLoaderData } from "react-router";

export function BoardTranslationSettings() {
  const loadedBoard = useRouteLoaderData<BoardLoaderResult>(BOARD_ROUTE_ID);
  const { language } = useLanguage();
  const { revalidate } = useRevalidator();
  if (!loadedBoard || loadedBoard.language !== language) {
    return null;
  }

  return (
    <BoardTranslationPreparation
      key={`${loadedBoard.setId}/${language}`}
      sourceLanguages={loadedBoard.translationSources}
      targetLanguage={language}
      onReady={() => void revalidate()}
    />
  );
}

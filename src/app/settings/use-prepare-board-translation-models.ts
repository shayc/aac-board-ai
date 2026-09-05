import type { BoardLoaderResult } from "@app/routing/loaders/board-loader";
import { BOARD_ROUTE_ID } from "@app/routing/route-ids";
import { prepareBoardTranslationModels } from "@features/board";
import { getStoredLanguage } from "@shared/language/language-store";
import { useLanguage } from "@shared/language/use-language";
import { useEffect, useRef } from "react";
import { useRevalidator, useRouteLoaderData } from "react-router";

export function usePrepareBoardTranslationModels() {
  const loadedBoard = useRouteLoaderData<BoardLoaderResult>(BOARD_ROUTE_ID);
  const { language } = useLanguage();
  const { revalidate } = useRevalidator();
  const pendingRef = useRef<{
    targetLanguage: string;
    controller: AbortController;
  } | null>(null);
  const setId = loadedBoard?.setId;

  useEffect(() => () => pendingRef.current?.controller.abort(), [setId]);
  useEffect(() => {
    if (pendingRef.current?.targetLanguage !== language) {
      pendingRef.current?.controller.abort();
    }
  }, [language]);

  return (targetLanguage: string) => {
    pendingRef.current?.controller.abort();
    const controller = new AbortController();
    pendingRef.current = { targetLanguage, controller };

    void prepareBoardTranslationModels(
      loadedBoard?.sourceLanguages ?? [],
      targetLanguage,
      controller.signal,
    ).then((didPrepare) => {
      if (
        didPrepare &&
        !controller.signal.aborted &&
        getStoredLanguage() === targetLanguage
      ) {
        void revalidate();
      }
    });
  };
}

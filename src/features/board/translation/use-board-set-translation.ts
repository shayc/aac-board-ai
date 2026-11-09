import { useLanguage } from "@shared/language/use-language";
import { useEffect, useEffectEvent } from "react";
import { useRevalidator } from "react-router";
import { syncBoardSets, useBoardSets } from "../board-sets/board-sets-store";
import { translateBoardSets } from "./translate-board-sets";

/**
 * Keeps every stored board set translated into the communication language,
 * in the background, so readers only ever pick from stored translations.
 */
export function useBoardSetTranslation(): void {
  const { language } = useLanguage();
  const { boardSets, isLoading } = useBoardSets();
  const { revalidate } = useRevalidator();

  const boardSetIdsKey = JSON.stringify(boardSets.map(({ id }) => id));

  const translate = useEffectEvent((signal: AbortSignal) =>
    translateBoardSets(boardSets, language, {
      signal,
      onTranslated: () => {
        void revalidate();
        void syncBoardSets();
      },
    }),
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const controller = new AbortController();
    void translate(controller.signal);

    return () => controller.abort();
  }, [language, boardSetIdsKey, isLoading]);
}

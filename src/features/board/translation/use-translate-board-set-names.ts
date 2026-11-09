import { useLanguage } from "@shared/language/use-language";
import { useEffect } from "react";
import { useBoardSets } from "../board-sets/board-sets-store";
import { translateBoardSetNames } from "./translate-board-set-names";

export function useTranslateBoardSetNames(): void {
  const { language } = useLanguage();
  const { boardSets } = useBoardSets();
  const boardSetIds = boardSets.map(({ id }) => id).join("\n");

  useEffect(() => {
    const controller = new AbortController();
    translateBoardSetNames(language, controller.signal).catch(() => undefined);

    return () => controller.abort();
  }, [language, boardSetIds]);
}

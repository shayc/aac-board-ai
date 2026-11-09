import { useLanguage } from "@shared/language/use-language";
import { useEffect } from "react";
import { useBoardSets } from "../board-sets/board-sets-store";
import { translateBoardSetNames } from "./translate-board-set-names";

export function useTranslateBoardSetNames(): void {
  const { language } = useLanguage();
  const { boardSets } = useBoardSets();

  useEffect(() => {
    const controller = new AbortController();
    translateBoardSetNames(boardSets, language, controller.signal).catch(
      () => undefined,
    );

    return () => controller.abort();
  }, [boardSets, language]);
}

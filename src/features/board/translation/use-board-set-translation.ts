import { useLanguage } from "@shared/language/use-language";
import { useEffect, useEffectEvent } from "react";
import { useLocation, useNavigation, useRevalidator } from "react-router";
import { syncBoardSets, useBoardSets } from "../board-sets/board-sets-store";
import { boardSetIdFromPath } from "../navigation/board-paths";
import type { BoardSetRecord } from "../storage/board-set-storage";
import {
  queueBoardTranslationPass,
  stopBoardTranslation,
} from "./board-translation-coordinator";
import {
  translateBoardSets,
  type TranslationOptions,
} from "./translate-board-sets";

export function useBoardSetTranslation(): void {
  const { language } = useLanguage();
  const { boardSets, isLoading } = useBoardSets();
  const { revalidate } = useRevalidator();
  const { pathname } = useLocation();
  const pendingPathname = useNavigation().location?.pathname;

  const boardSetIdsKey = JSON.stringify(boardSets.map(({ id }) => id));

  const refreshTranslatedBoardSet = useEffectEvent((boardSetId: string) => {
    const routedBoardSetIds = [pathname, pendingPathname].map(
      (path) => path && boardSetIdFromPath(path),
    );

    // Unrelated revalidation could restart an in-flight ?board= import.
    if (routedBoardSetIds.includes(boardSetId)) {
      void revalidate();
    }

    void syncBoardSets();
  });

  const translate = useEffectEvent((options: TranslationOptions) =>
    translateBoardSets(
      visibleFirst(boardSets, boardSetIdFromPath(pathname)),
      language,
      {
        ...options,
        onTranslated: (boardSetId) => refreshTranslatedBoardSet(boardSetId),
      },
    ),
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    queueBoardTranslationPass(language, (options) => translate(options));
  }, [language, boardSetIdsKey, isLoading]);

  useEffect(() => stopBoardTranslation, []);
}

function visibleFirst(
  boardSets: readonly BoardSetRecord[],
  visibleBoardSetId: string | undefined,
): BoardSetRecord[] {
  const visible = boardSets.filter(({ id }) => id === visibleBoardSetId);
  const others = boardSets.filter(({ id }) => id !== visibleBoardSetId);

  return [...visible, ...others];
}

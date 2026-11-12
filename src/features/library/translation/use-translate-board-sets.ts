import { useLanguage } from "@shared/language/use-language";
import { useEffect, useEffectEvent } from "react";
import { useLocation, useNavigation, useRevalidator } from "react-router";
import { syncBoardSets, useBoardSets } from "../board-sets/board-sets-store";
import { boardSetIdFromPath } from "../board-paths";
import type { BoardSetRecord } from "../storage/board-set-storage";
import {
  queueBoardTranslationPass,
  stopBoardTranslation,
} from "./board-translation-coordinator";
import {
  translateBoardSets,
  type TranslationPassOptions,
} from "./translate-board-sets";

export function useTranslateBoardSets(): void {
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

  const translate = useEffectEvent((options: TranslationPassOptions) =>
    translateBoardSets(
      activeFirst(boardSets, boardSetIdFromPath(pathname)),
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

function activeFirst(
  boardSets: readonly BoardSetRecord[],
  activeBoardSetId: string | undefined,
): BoardSetRecord[] {
  const active = boardSets.filter(({ id }) => id === activeBoardSetId);
  const others = boardSets.filter(({ id }) => id !== activeBoardSetId);

  return [...active, ...others];
}

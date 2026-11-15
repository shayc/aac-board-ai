import { useCommunicationLanguage } from "@shared/language/use-communication-language";
import { useEffect, useEffectEvent } from "react";
import { useLocation, useNavigation, useRevalidator } from "react-router";
import { boardSetIdFromPath } from "../board-paths";
import { useBoardSets } from "../board-sets/board-sets-store";
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
  const { language } = useCommunicationLanguage();
  const { boardSets, isLoading } = useBoardSets();
  const { revalidate } = useRevalidator();
  const { pathname } = useLocation();
  const pendingPathname = useNavigation().location?.pathname;

  const boardSetIdsKey = JSON.stringify(boardSets.map(({ id }) => id));

  const revalidateIfRouted = useEffectEvent((boardSetId: string) => {
    const routedBoardSetIds = [pathname, pendingPathname].map(
      (path) => path && boardSetIdFromPath(path),
    );

    // Unrelated revalidation could restart an in-flight ?board= import.
    if (routedBoardSetIds.includes(boardSetId)) {
      void revalidate();
    }
  });

  const translate = useEffectEvent((options: TranslationPassOptions) =>
    translateBoardSets(
      activeFirst(boardSets, boardSetIdFromPath(pathname)),
      language,
      {
        ...options,
        onTranslated: (boardSetId) => revalidateIfRouted(boardSetId),
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

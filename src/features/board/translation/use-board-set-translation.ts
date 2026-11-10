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

/**
 * Keeps every stored board set translated into the communication language,
 * in the background, so readers only ever pick from stored translations.
 */
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

    // Only routes showing or loading this set hold its data. Revalidating
    // for any other set would re-run a `?board=` link import still in flight.
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

// The set on screen is translated first, so it doesn't wait behind sets the
// user isn't looking at.
function visibleFirst(
  boardSets: readonly BoardSetRecord[],
  visibleBoardSetId: string | undefined,
): BoardSetRecord[] {
  const visible = boardSets.filter(({ id }) => id === visibleBoardSetId);
  const others = boardSets.filter(({ id }) => id !== visibleBoardSetId);

  return [...visible, ...others];
}

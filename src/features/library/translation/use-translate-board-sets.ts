import { useCommunicationLanguage } from "@shared/language/language-store";
import { useEffect, useEffectEvent } from "react";
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

interface UseTranslateBoardSetsOptions {
  /** The set on screen is translated first, so it never waits behind the rest. */
  activeBoardSetId: string | undefined;
  /** Called after a set's translations are saved, so whatever shows it can reload. */
  onBoardSetTranslated: (boardSetId: string) => void;
}

export function useTranslateBoardSets({
  activeBoardSetId,
  onBoardSetTranslated,
}: UseTranslateBoardSetsOptions): void {
  const { language } = useCommunicationLanguage();
  const { boardSets, isLoading } = useBoardSets();

  const boardSetIdsKey = JSON.stringify(boardSets.map(({ id }) => id));

  // Read the latest callback when a pass finishes, not the one it started with.
  const notifyTranslated = useEffectEvent((boardSetId: string) => {
    onBoardSetTranslated(boardSetId);
  });

  const translate = useEffectEvent((options: TranslationPassOptions) =>
    translateBoardSets(activeFirst(boardSets, activeBoardSetId), language, {
      ...options,
      onTranslated: (boardSetId) => notifyTranslated(boardSetId),
    }),
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

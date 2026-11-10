import { useLanguage } from "@shared/language/use-language";
import { useEffect, useEffectEvent, useRef } from "react";
import { useLocation, useNavigation, useRevalidator } from "react-router";
import { syncBoardSets, useBoardSets } from "../board-sets/board-sets-store";
import { boardSetIdFromPath } from "../navigation/board-paths";
import type { BoardSetRecord } from "../storage/board-set-storage";
import { setIsTranslatingBoards } from "./board-translation-status";
import { translateBoardSets } from "./translate-board-sets";

interface TranslationRun {
  readonly signal: AbortSignal;
  queue: Promise<void>;
}

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
  const runRef = useRef<TranslationRun | undefined>(undefined);

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

  const translate = useEffectEvent((signal: AbortSignal) =>
    translateBoardSets(
      visibleFirst(boardSets, boardSetIdFromPath(pathname)),
      language,
      {
        signal,
        onTranslating: () => {
          // A language change already cleared the status of an aborted run.
          if (!signal.aborted) {
            setIsTranslatingBoards(true);
          }
        },
        onTranslated: (boardSetId) => refreshTranslatedBoardSet(boardSetId),
      },
    ),
  );

  // Only a language change aborts. A set added or removed queues another pass
  // behind the one in progress: aborting it could cancel a model download
  // that, without the language change's user gesture, can't start again.
  useEffect(() => {
    const controller = new AbortController();
    runRef.current = { signal: controller.signal, queue: Promise.resolve() };

    return () => {
      controller.abort();
      setIsTranslatingBoards(false);
    };
  }, [language]);

  useEffect(() => {
    const run = runRef.current;
    if (isLoading || !run) {
      return;
    }

    run.queue = run.queue.then(async () => {
      try {
        await translate(run.signal);
      } finally {
        // An aborted run already cleared the status, and the next run may
        // have set it again.
        if (!run.signal.aborted) {
          setIsTranslatingBoards(false);
        }
      }
    });
  }, [language, boardSetIdsKey, isLoading]);
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

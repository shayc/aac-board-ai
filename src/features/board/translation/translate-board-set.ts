import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import type { Board } from "../board-types";
import { obfToBoard } from "../obf/obf-to-board";
import {
  listBoardRecords,
  replaceStringTranslations,
} from "../storage/board-content-storage";
import {
  collectBoardStrings,
  findStringTranslations,
  getBoardLanguage,
} from "./board-translations";
import { translateStrings, withTranslator } from "./translator";

export interface BoardSetTranslationProgress {
  completed: number;
  total: number;
}

const progressStore = createExternalStore<BoardSetTranslationProgress | null>(
  null,
);

export function useBoardSetTranslationProgress(): BoardSetTranslationProgress | null {
  return useExternalStore(progressStore);
}

export async function translateBoardSet(
  boardSetId: string,
  language: string,
  signal: AbortSignal,
): Promise<boolean> {
  const records = await listBoardRecords(boardSetId);
  const boards = records
    .map(({ obf }) => obfToBoard(obf))
    .filter((board) => needsTranslation(board, language));

  if (boards.length === 0) {
    return false;
  }

  const progress = { completed: 0, total: boards.length };

  function reportProgress(next: BoardSetTranslationProgress | null) {
    if (!signal.aborted) {
      progressStore.setState(next);
    }
  }

  signal.addEventListener("abort", () => progressStore.setState(null), {
    once: true,
  });
  reportProgress({ ...progress });

  try {
    for (const [sourceLanguage, group] of Map.groupBy(
      boards,
      getBoardLanguage,
    )) {
      await withTranslator(
        { sourceLanguage, targetLanguage: language, signal },
        async (translator) => {
          for (const board of group) {
            const translations = await translateStrings(
              collectBoardStrings(board),
              translator,
              signal,
            );
            await replaceStringTranslations(
              boardSetId,
              board.id,
              language,
              translations,
            );

            progress.completed += 1;
            reportProgress({ ...progress });
          }
        },
      );
    }
  } catch {
    signal.throwIfAborted();
  } finally {
    reportProgress(null);
  }

  return progress.completed > 0;
}

function needsTranslation(board: Board, language: string): boolean {
  return (
    getBoardLanguage(board) !== language &&
    !findStringTranslations(board.translationsByLocale, language) &&
    collectBoardStrings(board).size > 0
  );
}

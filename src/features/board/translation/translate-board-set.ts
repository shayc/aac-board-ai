import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import { createTranslator } from "@shayc/react-built-in-ai";
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
import { translateStrings } from "./translator";

export interface BoardSetTranslationProgress {
  completed: number;
  total: number;
}

interface TranslateBoardSetOptions {
  firstBoardId?: string;
  signal: AbortSignal;
  onBoardTranslated: () => void;
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
  { firstBoardId, signal, onBoardTranslated }: TranslateBoardSetOptions,
): Promise<void> {
  const boards = await listBoardsToTranslate(
    boardSetId,
    language,
    firstBoardId,
  );
  if (boards.length === 0) {
    return;
  }

  const total = boards.length;
  let completed = 0;

  function reportProgress(progress: BoardSetTranslationProgress | null) {
    if (!signal.aborted) {
      progressStore.setState(progress);
    }
  }

  async function translateBoard(board: Board, translator: Translator) {
    try {
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
      onBoardTranslated();
    } catch {
      signal.throwIfAborted();
    }

    completed += 1;
    reportProgress({ completed, total });
  }

  signal.addEventListener("abort", () => progressStore.setState(null), {
    once: true,
  });
  reportProgress({ completed, total });

  for (const [sourceLanguage, group] of Map.groupBy(boards, getBoardLanguage)) {
    try {
      await using translator = await createTranslator({
        sourceLanguage,
        targetLanguage: language,
        signal,
      });

      for (const board of group) {
        await translateBoard(board, translator);
      }
    } catch {
      signal.throwIfAborted();
    }
  }

  reportProgress(null);
}

async function listBoardsToTranslate(
  boardSetId: string,
  language: string,
  firstBoardId: string | undefined,
): Promise<Board[]> {
  const records = await listBoardRecords(boardSetId);
  const boards = records
    .map(({ obf }) => obfToBoard(obf))
    .filter((board) => needsTranslation(board, language));

  return withBoardFirst(boards, firstBoardId);
}

function needsTranslation(board: Board, language: string): boolean {
  return (
    getBoardLanguage(board) !== language &&
    !findStringTranslations(board.translationsByLocale, language) &&
    collectBoardStrings(board).size > 0
  );
}

function withBoardFirst(boards: Board[], boardId: string | undefined): Board[] {
  const first = boards.find((board) => board.id === boardId);

  return first ? [first, ...boards.filter((board) => board !== first)] : boards;
}

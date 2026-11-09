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
  findBoardInLanguage,
  getBoardLanguage,
} from "./board-translations";
import { translateStrings } from "./translate-strings";

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

  const progress = startProgress(boards.length, signal);

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
  }

  for (const [sourceLanguage, group] of Map.groupBy(boards, getBoardLanguage)) {
    try {
      await using translator = await createTranslator({
        sourceLanguage,
        targetLanguage: language,
        signal,
      });

      for (const board of group) {
        await translateBoard(board, translator);
        progress.advance();
      }
    } catch {
      signal.throwIfAborted();
    }
  }

  progress.end();
}

function startProgress(total: number, signal: AbortSignal) {
  let completed = 0;

  function report(progress: BoardSetTranslationProgress | null) {
    if (!signal.aborted) {
      progressStore.setState(progress);
    }
  }

  function advance() {
    completed += 1;
    report({ completed, total });
  }

  function end() {
    report(null);
  }

  signal.addEventListener("abort", () => progressStore.setState(null), {
    once: true,
  });
  report({ completed, total });

  return { advance, end };
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
    !findBoardInLanguage(board, language) && collectBoardStrings(board).size > 0
  );
}

function withBoardFirst(boards: Board[], boardId: string | undefined): Board[] {
  const first = boards.find((board) => board.id === boardId);

  return first ? [first, ...boards.filter((board) => board !== first)] : boards;
}

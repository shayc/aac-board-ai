import type { Board } from "../board-types";
import { loadStoredBoard } from "../storage/load-stored-board";
import { findBoardInLanguage } from "./board-translations";

export async function loadBoardInLanguage(
  boardSetId: string,
  boardId: string,
  language: string,
  signal?: AbortSignal,
): Promise<Board> {
  const board = await loadStoredBoard(boardSetId, boardId, signal);

  return findBoardInLanguage(board, language) ?? board;
}

import type { Board } from "@shared/board/board-types";
import { useLanguage } from "@shared/language/use-language";
import { findBoardInLanguage } from "./board-translations";

export function useBoardInLanguage(board: Board): Board {
  const { language } = useLanguage();

  return findBoardInLanguage(board, language) ?? board;
}

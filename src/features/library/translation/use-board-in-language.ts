import { useLanguage } from "@shared/language/use-language";
import type { Board } from "../board-types";
import { findBoardInLanguage } from "./board-translations";

export function useBoardInLanguage(board: Board): Board {
  const { language } = useLanguage();

  return findBoardInLanguage(board, language) ?? board;
}

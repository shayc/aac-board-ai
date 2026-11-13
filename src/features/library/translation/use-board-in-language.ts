import { useLanguage } from "@shared/language/use-language";
import type { Board } from "../board-types";
import { findBoardInLanguage, getSourceLanguage } from "./board-translations";

interface BoardInLanguage {
  board: Board;
  language: string;
}

/** Falls back to the source board, in its own language, when untranslated. */
export function useBoardInLanguage(board: Board): BoardInLanguage {
  const { language } = useLanguage();
  const translatedBoard = findBoardInLanguage(board, language);

  return translatedBoard
    ? { board: translatedBoard, language }
    : { board, language: getSourceLanguage(board) };
}

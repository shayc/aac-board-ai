import { getLanguageCode } from "@shared/language/locale";
import { useCommunicationLanguage } from "@shared/language/use-communication-language";
import type { Board } from "../board-types";
import { findBoardInLanguage } from "./board-translations";

interface BoardInLanguage {
  board: Board;
  language: string | undefined;
}

/**
 * Falls back to the source board when untranslated. Its language is then the
 * one the board file declares, and unknown when it declares none.
 */
export function useBoardInLanguage(board: Board): BoardInLanguage {
  const { language } = useCommunicationLanguage();
  const translatedBoard = findBoardInLanguage(board, language);
  if (translatedBoard) {
    return { board: translatedBoard, language };
  }

  return {
    board,
    language: board.locale ? getLanguageCode(board.locale) : undefined,
  };
}

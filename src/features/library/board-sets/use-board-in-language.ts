import { useCommunicationLanguage } from "@shared/language/language-store";
import { getLanguageCode } from "@shared/language/locale";
import type { Board } from "../board-types";
import { findBoardInLanguage } from "./board-in-language";

interface BoardInLanguage {
  board: Board;
  language: string | undefined;
}

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

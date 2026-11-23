import { useCommunicationLanguage } from "@shared/language/language-store";
import type { Board } from "../board-types";
import { resolveBoardInLanguage } from "./board-in-language";

export function useBoardInLanguage(board: Board) {
  const { language } = useCommunicationLanguage();

  return resolveBoardInLanguage(board, language);
}

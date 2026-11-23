import { useCommunicationLanguage } from "@shared/language/language-store";
import type { Board, StoredBoard } from "../board-types";
import { resolveBoardInLanguage } from "./board-in-language";

export function useBoardInLanguage(storedBoard: StoredBoard): Board {
  const { language } = useCommunicationLanguage();

  return resolveBoardInLanguage(storedBoard, language);
}

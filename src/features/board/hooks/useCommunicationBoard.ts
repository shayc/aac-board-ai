import type { Board, BoardButton } from "@features/board/types";
import {
  useBoardNavigation,
  type UseBoardNavigationReturn,
} from "./useBoardNavigation";
import { useBoardTranslation } from "./useBoardTranslation";
import { useButtonActivation } from "./useButtonActivation";
import { useLoadBoard } from "./useLoadBoard";
import { useMessage, type UseMessageReturn } from "./useMessage";
import { useSuggestions, type UseSuggestionsReturn } from "./useSuggestions";

export interface UseCommunicationBoardOptions {
  setId: string;
  boardId: string;
}

export interface UseCommunicationBoardReturn {
  board: Board | null;
  message: UseMessageReturn;
  suggestions: UseSuggestionsReturn;
  navigation: UseBoardNavigationReturn;
  activateButton: (button: BoardButton) => Promise<void>;
}

export function useCommunicationBoard({
  setId,
  boardId,
}: UseCommunicationBoardOptions): UseCommunicationBoardReturn {
  const { board } = useLoadBoard({ setId, boardId });
  const { translatedBoard } = useBoardTranslation({ board });

  const message = useMessage();
  const suggestions = useSuggestions(message.text);
  const navigation = useBoardNavigation();
  const { activateButton } = useButtonActivation({ message, navigation });

  return {
    board: translatedBoard,
    message,
    suggestions,
    navigation,
    activateButton,
  };
}

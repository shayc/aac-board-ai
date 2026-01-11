import type { Board, BoardButton } from "@features/board/types";
import { useAI } from "@shared/contexts/AIProvider/useAI";
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
  board: {
    data: Board | null;
    activateButton: (button: BoardButton) => Promise<void>;
  };
  message: UseMessageReturn;
  navigation: UseBoardNavigationReturn;
  suggestions: UseSuggestionsReturn;
}

export function useCommunicationBoard({
  setId,
  boardId,
}: UseCommunicationBoardOptions): UseCommunicationBoardReturn {
  const { board } = useLoadBoard({ setId, boardId });
  const { translatedBoard } = useBoardTranslation({ board });

  const message = useMessage();
  const navigation = useBoardNavigation();

  const { sharedContext } = useAI();
  const suggestions = useSuggestions(message.text, sharedContext);

  const { activateButton } = useButtonActivation({ message, navigation });

  return {
    board: {
      data: translatedBoard ?? board,
      activateButton,
    },
    message,
    navigation,
    suggestions,
  };
}

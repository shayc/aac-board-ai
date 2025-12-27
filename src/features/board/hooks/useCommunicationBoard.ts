import type { Board, BoardButton } from "@features/board/types";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { useBoardTranslation } from "./useBoardTranslation";
import { useButtonActivation } from "./useButtonActivation";
import { useLoadBoard } from "./useLoadBoard";
import { useMessage, type MessagePart } from "./useMessage";
import { useBoardNavigation } from "./useBoardNavigation";
import { useSuggestions } from "./useSuggestions";

export interface UseCommunicationBoardOptions {
  setId: string;
  boardId: string;
}

export interface UseCommunicationBoardReturn {
  // Board
  board: Board | null;
  activateButton: (button: BoardButton) => Promise<void>;

  // Message
  message: MessagePart[];
  isPlayingMessage: boolean;
  addPart: (part: MessagePart) => void;
  setMessage: (parts: MessagePart[]) => void;
  removeLastPart: () => void;
  updateLastPart: (part: Partial<MessagePart>) => void;
  clearMessage: () => void;
  playMessage: () => Promise<void>;
  stopMessage: () => void;

  // Navigation
  navigationHistory: string[];
  canGoBack: boolean;
  canGoHome: boolean;
  navigateToBoard: (id: string) => void;
  navigateBack: () => void;
  navigateHome: () => void;

  // Suggestions
  suggestions: string[];
  isSuggestionsEnabled: boolean;
  suggestionTone: RewriterTone;
  setSuggestionTone: (tone: RewriterTone) => void;
}

export function useCommunicationBoard({
  setId,
  boardId,
}: UseCommunicationBoardOptions): UseCommunicationBoardReturn {
  const { sharedContext } = useAI();

  const { board } = useLoadBoard({ setId, boardId });
  const { translatedBoard } = useBoardTranslation({ board });

  const {
    canGoBack,
    canGoHome,
    navigationHistory,
    navigateToBoard,
    navigateBack,
    navigateHome,
  } = useBoardNavigation();

  const {
    message,
    messageText,
    isPlayingMessage,
    addPart,
    setMessage,
    removeLastPart,
    updateLastPart,
    clearMessage,
    addSpace,
    playMessage,
    stopMessage,
  } = useMessage();

  const {
    suggestions,
    isSuggestionsEnabled,
    suggestionTone,
    setSuggestionTone,
  } = useSuggestions(messageText, sharedContext);

  const { activateButton } = useButtonActivation({
    navigateToBoard,
    addPart,
    updateLastPart,
    addSpace,
    clearMessage,
    navigateHome,
    playMessage,
    removeLastPart,
    message,
  });

  return {
    // Board
    board: translatedBoard ?? board,
    activateButton,

    // Message
    message,
    isPlayingMessage,
    addPart,
    setMessage,
    removeLastPart,
    updateLastPart,
    clearMessage,
    playMessage,
    stopMessage,

    // Navigation
    navigationHistory,
    canGoBack,
    canGoHome,
    navigateToBoard,
    navigateBack,
    navigateHome,

    // Suggestions
    suggestions,
    isSuggestionsEnabled,
    suggestionTone,
    setSuggestionTone,
  };
}

import type { Board, BoardButton } from "@features/board/types";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { useLanguage } from "@shared/contexts/LanguageProvider/useLanguage";
import { useButtonActivation } from "./useButtonActivation";
import { useLoadBoard } from "./useLoadBoard";
import { useMessage, type MessagePart } from "./useMessage";
import { useNavigation } from "./useNavigation";
import { useSuggestions } from "./useSuggestions";
import { useBoardTranslation } from "./useBoardTranslation";

export interface CommunicationBoardOptions {
  setId: string;
  boardId: string;
}

export interface CommunicationBoardReturn {
  // Board
  board: Board | null;
  activateButton: (button: BoardButton) => Promise<void>;

  // Message
  message: MessagePart[];
  isPlayingMessage: boolean;
  addMessage: (part: MessagePart) => void;
  setMessage: (parts: MessagePart[]) => void;
  removeLastMessage: () => void;
  updateLastMessage: (part: Partial<MessagePart>) => void;
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
}: CommunicationBoardOptions): CommunicationBoardReturn {
  const { languageCode } = useLanguage();
  const { sharedContext } = useAI();

  // Load raw board
  const { board: rawBoard } = useLoadBoard({ setId, boardId });

  // Translate board
  const board = useBoardTranslation({ board: rawBoard, languageCode });

  // Navigation
  const navigation = useNavigation();

  // Message
  const messageHook = useMessage();

  // Suggestions
  const suggestionsHook = useSuggestions(messageHook.message, sharedContext);

  // Button activation
  const { activateButton } = useButtonActivation({
    message: messageHook.message,
    addMessage: messageHook.addMessage,
    updateLastMessage: messageHook.updateLastMessage,
    addSpace: messageHook.addSpace,
    clearMessage: messageHook.clearMessage,
    removeLastMessage: messageHook.removeLastMessage,
    playMessage: messageHook.playMessage,
    navigateToBoard: navigation.navigateToBoard,
    navigateHome: navigation.navigateHome,
  });

  return {
    // Board
    board,
    activateButton,

    // Message
    ...messageHook,

    // Navigation
    ...navigation,

    // Suggestions
    ...suggestionsHook,
  };
}

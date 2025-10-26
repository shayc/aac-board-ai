import { useLanguage } from "@/shared/contexts/LanguageProvider/useLanguage";
import { useSpeech } from "@/shared/contexts/SpeechProvider/SpeechProvider";
import { useTranslator } from "@/shared/hooks/ai/useTranslator";
import { useAudio } from "@/shared/hooks/useAudio";
import {
  getAssetUrlByPath,
  getBoardsBatch,
  openBoardsDB,
} from "@features/board/db/boards-db";
import { obfToBoard } from "@features/board/mappers/obf-mapper";
import type { Action, Board, Button } from "@features/board/types";
import { useEffect, useState } from "react";
import { useMessage, type MessagePart } from "./useMessage";
import { useNavigation } from "./useNavigation";
import { useSuggestions } from "./useSuggestions";

type ActionHandler = () => void | Promise<void>;

export interface UseCommunicationBoardOptions {
  setId: string;
  boardId: string;
}

export interface UseCommunicationBoardReturn {
  // Board
  board: Board | null;
  activateButton: (button: Button) => void;

  // Message
  message: MessagePart[];
  isPlayingMessage: boolean;
  addMessage: (part: MessagePart) => void;
  setMessage: (parts: MessagePart[]) => void;
  removeLastMessage: () => void;
  updateLastMessage: (part: Partial<MessagePart>) => void;
  clearMessage: () => void;
  playMessage: () => Promise<void>;

  // Navigation
  navigationHistory: string[];
  canGoBack: boolean;
  canGoHome: boolean;
  navigateToBoard: (id: string) => void;
  navigateBack: () => void;
  navigateHome: () => void;

  // Suggestions
  suggestions: string[];
  suggestionTone: RewriterTone;
  setSuggestionTone: (tone: RewriterTone) => void;
}

export function useCommunicationBoard({
  setId,
  boardId,
}: UseCommunicationBoardOptions): UseCommunicationBoardReturn {
  const { languageCode } = useLanguage();
  const { createTranslator } = useTranslator();

  const speech = useSpeech();
  const audio = useAudio();

  const [board, setBoard] = useState<Board | null>(null);
  const [translatedBoard, setTranslatedBoard] = useState<Board | null>(null);

  const {
    canGoBack,
    canGoHome,
    navigationHistory,
    navigateToBoard,
    navigateBack,
    navigateHome,
  } = useNavigation();

  const {
    message,
    isPlayingMessage,
    addMessage,
    setMessage,
    removeLastMessage,
    updateLastMessage,
    clearMessage,
    addSpace,
    playMessage,
  } = useMessage();

  const { suggestions, suggestionTone, setSuggestionTone } =
    useSuggestions(message, board);

  const actionHandlers: Record<string, ActionHandler> = {
    ":space": addSpace,
    ":clear": clearMessage,
    ":home": navigateHome,
    ":speak": playMessage,
    ":backspace": removeLastMessage,
  };

  function executeAction(action: Action) {
    if (action.startsWith("+")) {
      const text = action.slice(1).trim();

      updateLastMessage({
        id: text,
        label: `${message[message.length - 1]?.label ?? ""}${text}`,
      });

      return;
    }

    const handler = actionHandlers[action];
    handler?.();
  }

  const activateButton = async (button: Button) => {
    if (button.loadBoard?.id) {
      navigateToBoard(button.loadBoard.id);
      return;
    }

    if (button.actions?.length) {
      for (const action of button.actions) {
        await executeAction(action);
      }

      return;
    }

    const messagePart = {
      id: button.id,
      label: button.label,
      imageSrc: button.imageSrc,
      soundSrc: button.soundSrc,
      vocalization: button.vocalization,
    };

    addMessage(messagePart);

    if (button.soundSrc) {
      audio.play(button.soundSrc);
      return;
    }

    const text = button.vocalization ?? button.label;

    if (text) {
      speech.speak(text.toLowerCase());
    }
  };

  const loadBoard = async (boardId: string) => {
    try {
      const db = await openBoardsDB();

      try {
        const [boardData] = await getBoardsBatch(db, setId, [boardId]);

        if (!boardData) {
          throw new Error(`Board not found: ${boardId}`);
        }

        const obfBoard = boardData.json;

        if (obfBoard.images) {
          for (const img of obfBoard.images) {
            if (img.path) {
              try {
                const url = await getAssetUrlByPath(db, setId, img.path);
                if (url) img.data = url;
              } catch (err) {
                console.warn(
                  `Failed to load image ${img.id} from path ${img.path}:`,
                  err
                );
              }
            }
          }
        }

        if (obfBoard.sounds) {
          for (const sound of obfBoard.sounds) {
            if (sound.path) {
              try {
                const url = await getAssetUrlByPath(db, setId, sound.path);
                if (url) sound.data = url;
              } catch (err) {
                console.warn(
                  `Failed to load sound ${sound.id} from path ${sound.path}:`,
                  err
                );
              }
            }
          }
        }

        const newBoard = obfToBoard(obfBoard);

        setBoard(newBoard);
      } finally {
        db.close();
      }
    } catch (err) {
      console.error("Error loading board:", err);
    }
  };

  useEffect(() => {
    const translatedBoard = async () => {
      if (!board) {
        return;
      }

      if (languageCode.includes("en")) {
        setTranslatedBoard(null);
        return;
      }

      const translator = await createTranslator({
        sourceLanguage: "en",
        targetLanguage: languageCode,
      });

      const translatedName = await translator?.translate(board.name || "");
      const translatedButtons = await Promise.all(
        board.buttons.map(async (button) => {
          let translatedLabel = button.label;
          if (button.label) {
            translatedLabel = await translator?.translate(button.label);
          }

          let translatedVocalization = button.vocalization;
          if (button.vocalization) {
            translatedVocalization = await translator?.translate(
              button.vocalization
            );
          }

          return {
            ...button,
            label: translatedLabel,
            vocalization: translatedVocalization,
          };
        })
      );

      setTranslatedBoard({
        ...board,
        name: translatedName,
        buttons: translatedButtons,
      });
    };

    translatedBoard();
  }, [languageCode, board]);

  useEffect(() => {
    loadBoard(boardId);
  }, [boardId]);

  return {
    // Board
    board: translatedBoard || board,
    activateButton,

    // Message
    message,
    isPlayingMessage,
    addMessage,
    setMessage,
    removeLastMessage,
    updateLastMessage,
    clearMessage,
    playMessage,

    // Navigation
    navigationHistory,
    canGoBack,
    canGoHome,
    navigateToBoard,
    navigateBack,
    navigateHome,

    // Suggestions
    suggestions,
    suggestionTone,
    setSuggestionTone,
  };
}

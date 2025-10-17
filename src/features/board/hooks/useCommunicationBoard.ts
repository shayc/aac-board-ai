import { useSpeech } from "@/shared/contexts/SpeechProvider/SpeechProvider";
import { useAudio } from "@/shared/hooks/useAudio";
import {
  getAssetUrlByPath,
  getBoardsBatch,
  openBoardsDB,
} from "@features/board/db/boards-db";
import { obfToBoard } from "@features/board/mappers/obf-mapper";
import type { Board, BoardButton } from "@features/board/types";
import { useEffect, useState } from "react";
import type { MessagePart } from "./useMessage";
import { useMessage } from "./useMessage";
import { useNavigation } from "./useNavigation";

export interface UseCommunicationBoardOptions {
  setId: string;
  boardId: string;
}

export interface UseCommunicationBoardReturn {
  // Board
  board: Board | null;
  playBoardButton: (button: BoardButton) => void;

  // Message
  message: MessagePart[];
  addMessage: (part: MessagePart) => void;
  removeLastMessage: () => void;
  updateLastMessage: (part: Partial<MessagePart>) => void;
  clearMessage: () => void;
  playMessage: () => Promise<void>;

  // Navigation
  navigationHistory: string[];
  canGoBack: boolean;
  canGoForward: boolean;
  navigateToBoard: (id: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  navigateHome: () => void;
}

export function useCommunicationBoard({
  setId,
  boardId,
}: UseCommunicationBoardOptions): UseCommunicationBoardReturn {
  const [board, setBoard] = useState<Board | null>(null);

  const {
    canGoBack,
    canGoForward,
    navigationHistory,
    navigateToBoard,
    navigateBack,
    navigateForward,
    navigateHome,
  } = useNavigation();

  const {
    message,
    addMessage,
    removeLastMessage,
    updateLastMessage,
    clearMessage,
    playMessage,
  } = useMessage();

  const speech = useSpeech();
  const audio = useAudio();

  const playBoardButton = (button: BoardButton) => {
    if (button.loadBoard?.id) {
      console.log("Loading board:", button.loadBoard.id);
      navigateToBoard(button.loadBoard.id);
      return;
    }

    if (button.actions?.length) {
      for (const action of button.actions) {
        if (action === ":space") {
          addMessage({
            id: "space",
            label: "",
          });
        }

        if (action === ":clear") {
          clearMessage();
        }

        if (action === ":home") {
          navigateHome();
        }

        if (action === ":speak") {
          playMessage();
        }

        if (action === ":backspace") {
          removeLastMessage();
        }

        if (action.startsWith("+")) {
          const text = action.slice(1).trim();

          updateLastMessage({
            id: text,
            label: `${message[message.length - 1].label}${text}`,
          });
        }
      }

      return;
    }

    addMessage({
      id: button.id,
      label: button.label,
      imageSrc: button.imageSrc,
      soundSrc: button.soundSrc,
      vocalization: button.vocalization,
    });

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
    loadBoard(boardId);
  }, [boardId]);

  return {
    // Board
    board,
    playBoardButton,

    // Message
    message,
    addMessage,
    removeLastMessage,
    updateLastMessage,
    clearMessage,
    playMessage,

    // Navigation
    navigationHistory,
    canGoBack,
    canGoForward,
    navigateToBoard,
    navigateBack,
    navigateForward,
    navigateHome,
  };
}

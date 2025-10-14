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
import { useAISuggestions } from "./useAISuggestions";
import { useMessage } from "./useMessage";
import { useNavigation } from "./useNavigation";

export interface UseCommunicationBoardOptions {
  setId?: string;
  boardId?: string;
}

export interface UseCommunicationBoardResult {
  message: ReturnType<typeof useMessage>;
  suggestions: ReturnType<typeof useAISuggestions>;
  navigation: ReturnType<typeof useNavigation>;
  board: {
    current: Board | null;
    isLoading: boolean;
    error: Error | null;
    load: (boardId: string) => Promise<void>;
    onButtonClick: (button: BoardButton) => Promise<void>;
  };
}

export function useCommunicationBoard(
  options: UseCommunicationBoardOptions = {}
): UseCommunicationBoardResult {
  const { setId, boardId } = options;
  const initialBoardId = boardId || "lots_of_stuff";

  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(!!setId);
  const [error, setError] = useState<Error | null>(null);

  const navigation = useNavigation({ rootBoardId: initialBoardId });
  const message = useMessage();
  const speech = useSpeech();
  const audio = useAudio();
  const suggestions = useAISuggestions({
    words: message.parts,
    boardButtons: board?.buttons,
  });

  const onButtonClick = async (button: BoardButton) => {
    if (button.loadBoard && setId) {
      if (button.loadBoard.id) {
        navigation.goToBoard(button.loadBoard.id);
        return;
      }
    }

    const hasActions = button.actions && button.actions.length > 0;

    if (hasActions) {
      return;
    }

    message.appendPart({
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
      speech.speak(text?.toLowerCase());
    }
  };

  const loadBoard = async (newBoardId: string) => {
    if (!setId) {
      console.error("Cannot load board: setId is not defined");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const db = await openBoardsDB();

      try {
        const [boardData] = await getBoardsBatch(db, setId, [newBoardId]);

        if (!boardData) {
          throw new Error(`Board not found: ${newBoardId}`);
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
      setError(err instanceof Error ? err : new Error("Failed to load board"));
    } finally {
      setIsLoading(false);
    }
  };

  // Load board from IndexedDB
  useEffect(() => {
    async function loadFromDB() {
      const db = await openBoardsDB();

      try {
        const [boardData] = await getBoardsBatch(db, setId!, [boardId!]);

        if (!boardData) {
          throw new Error(`Board not found: ${boardId}`);
        }

        const obfBoard = boardData.json;

        if (obfBoard.images) {
          for (const img of obfBoard.images) {
            if (img.path) {
              try {
                const url = await getAssetUrlByPath(db, setId!, img.path);
                if (url) {
                  img.data = url;
                }
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
                const url = await getAssetUrlByPath(db, setId!, sound.path);
                if (url) sound.data = url;
              } catch (err) {
                console.warn(
                  `Failed to load sound ${sound.id} from path ${sound.path}:`,
                  err
                );
                // Skip this sound if path is invalid
              }
            }
          }
        }

        // Now convert to internal format
        const board = obfToBoard(obfBoard);
        console.log("Converted board:", board);
        setBoard(board);
        console.log("Board loaded successfully!");
      } catch (err) {
        console.error("Error loading board:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load board")
        );
      } finally {
        setIsLoading(false);
        db.close();
      }
    }

    loadFromDB();
  }, [setId, boardId, initialBoardId]);

  return {
    message,
    suggestions,
    navigation,
    board: {
      current: board,
      isLoading,
      error,
      onButtonClick,
      load: loadBoard,
    },
  };
}

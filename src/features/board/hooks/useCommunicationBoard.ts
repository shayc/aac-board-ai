import {
  getAssetUrlByPath,
  getBoardsBatch,
  openBoardsDb,
} from "@features/board/db/boards-db";
import type { Board, BoardContextValue } from "@features/board/types";
import projectCore from "@shared/lib/open-board-format/examples/project-core.json";
import camelcaseKeys from "camelcase-keys";
import { useEffect, useState } from "react";
import { useNavigation } from "./useNavigation";
import { useOutput } from "./useOutput";
import { useSuggestions } from "./useSuggestions";

export interface UseCommunicationBoardOptions {
  setId?: string;
  boardId?: string;
}

/**
 * Orchestrator hook that composes all communication board functionality.
 * Initializes and coordinates useNavigation, useOutput, and useSuggestions.
 *
 * @param options - Configuration options
 * @param options.initialBoardId - ID of the initial board to load
 * @returns {BoardContextValue} Complete board context value
 */
export function useCommunicationBoard(
  options: UseCommunicationBoardOptions = {}
): BoardContextValue {
  const { setId, boardId } = options;
  const initialBoardId = boardId || "lots_of_stuff";

  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(!!setId);
  const [error, setError] = useState<Error | null>(null);

  // Load board from IndexedDB
  useEffect(() => {
    if (!setId || !boardId) {
      // Load default example board
      const board = camelcaseKeys(projectCore, {
        deep: true,
      }) as unknown as Board;
      setBoard(board);
      setIsLoading(false);
      return;
    }

    async function loadFromDb() {
      console.log("Loading board from IndexedDB:", { setId, boardId });
      const db = await openBoardsDb();
      try {
        const [boardData] = await getBoardsBatch(db, setId!, [boardId!]);
        console.log("Board data from DB:", boardData);
        if (!boardData) {
          throw new Error(`Board not found: ${boardId}`);
        }

        // Resolve asset URLs from IndexedDB before converting
        const obfBoard = boardData.json;
        console.log("OBF Board:", obfBoard);

        if (obfBoard.images) {
          for (const img of obfBoard.images) {
            if (img.path) {
              try {
                const url = await getAssetUrlByPath(db, setId!, img.path);
                if (url) img.data = url;
              } catch (err) {
                console.warn(
                  `Failed to load image ${img.id} from path ${img.path}:`,
                  err
                );
                // Skip this image if path is invalid
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
        const board = camelcaseKeys(obfBoard, { deep: true }) as Board;
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

    loadFromDb();
  }, [setId, boardId, initialBoardId]);

  const nav = useNavigation({ initialBoardId });
  const output = useOutput();
  const suggestions = useSuggestions({
    words: output.words,
    boardButtons: board?.buttons,
  });

  const loadBoard = async (newBoardId: string) => {
    if (!setId) {
      console.error("Cannot load board: setId is not defined");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading new board from IndexedDB:", { setId, boardId: newBoardId });
      const db = await openBoardsDb();
      
      try {
        const [boardData] = await getBoardsBatch(db, setId, [newBoardId]);
        console.log("Board data from DB:", boardData);
        
        if (!boardData) {
          throw new Error(`Board not found: ${newBoardId}`);
        }

        // Resolve asset URLs from IndexedDB before converting
        const obfBoard = boardData.json;
        console.log("OBF Board:", obfBoard);

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

        // Convert to internal format
        const newBoard = camelcaseKeys(obfBoard, { deep: true }) as Board;
        console.log("Converted board:", newBoard);
        setBoard(newBoard);
        console.log("Board loaded successfully!");
      } finally {
        db.close();
      }
    } catch (err) {
      console.error("Error loading board:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load board")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const reloadBoard = async () => {
    if (boardId) {
      await loadBoard(boardId);
    }
  };

  return {
    // Navigation
    currentBoardId: nav.currentBoardId,
    history: nav.history,
    canGoBack: nav.canGoBack,
    goToBoard: nav.goToBoard,
    goBack: nav.goBack,
    goHome: nav.goHome,

    // Output
    words: output.words,
    addWord: output.addWord,
    removeWord: output.removeWord,
    clearWords: output.clear,

    // Suggestions
    suggestions: suggestions.suggestions,
    tone: suggestions.tone,
    isGenerating: suggestions.isGenerating,
    changeTone: suggestions.changeTone,
    regenerateSuggestions: suggestions.regenerate,
    requestProofreaderSession: suggestions.requestSession,

    board,
    boards: new Map<string, Board>(),
    isLoading,
    error,
    loadBoard,
    reloadBoard,
  };
}

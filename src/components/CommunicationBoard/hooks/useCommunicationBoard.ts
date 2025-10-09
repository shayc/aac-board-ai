import camelcaseKeys from "camelcase-keys";
import { useState } from "react";
import type { Board, BoardContextValue } from "../types";
import projectCore from "../../../open-board-format/examples/project-core.json";
import { useNavigation } from "./useNavigation";
import { useOutput } from "./useOutput";
import { useSuggestions } from "./useSuggestions";

export interface UseCommunicationBoardOptions {
  initialBoardId?: string;
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
  const { initialBoardId = "lots_of_stuff" } = options;

  const [boards, setBoards] = useState<Map<string, Board>>(() => {
    const board = camelcaseKeys(projectCore, { deep: true }) as unknown as Board;
    return new Map([[initialBoardId, board]]);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const nav = useNavigation({ initialBoardId, boards });
  const output = useOutput();
  const suggestions = useSuggestions({ words: output.words });

  const loadBoard = async (boardId: string) => {
    if (boards.has(boardId)) return;

    setIsLoading(true);
    setError(null);

    try {
      await Promise.resolve();
      throw new Error(`Board loading not implemented: ${boardId}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load board"));
    } finally {
      setIsLoading(false);
    }
  };

  const reloadBoard = async () => {
    const id = nav.currentBoardId;
    setBoards((prev) => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });
    await loadBoard(id);
  };

  return {
    // Navigation
    currentBoardId: nav.currentBoardId,
    currentBoard: nav.currentBoard,
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

    // Boards
    boards,
    isLoading,
    error,
    loadBoard,
    reloadBoard,
  };
}

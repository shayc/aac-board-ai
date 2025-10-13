import { createContext } from "react";
import type { UtteranceToken } from "../hooks/useUtterance";
import type { Board } from "../types";

export interface BoardContextValue {
  utterance: {
    tokens: UtteranceToken[];
    appendToken: (token: UtteranceToken) => void;
    popToken: () => void;
    clear: () => void;
    play: () => void;
  };

  suggestions: {
    items: string[];
    tone: "neutral" | "formal" | "casual";
    isGenerating: boolean;
    changeTone: (tone: "neutral" | "formal" | "casual") => void;
    regenerate: () => void;
    requestSession: () => Promise<void>;
  };

  navigation: {
    currentBoardId: string;
    history: string[];
    canGoBack: boolean;
    goToBoard: (boardId: string) => void;
    goBack: () => void;
    goHome: () => void;
  };

  board: {
    current: Board | null;
    isLoading: boolean;
    error: Error | null;
    load: (boardId: string) => Promise<void>;
    reload: () => Promise<void>;
  };
}

export const BoardContext = createContext<BoardContextValue | undefined>(
  undefined
);

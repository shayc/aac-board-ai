import { useSpeech } from "@/shared/contexts/SpeechProvider/SpeechProvider";
import { useAudio } from "@/shared/hooks/useAudio";
import type { RewriterTone } from "@/shared/hooks/ai/useRewriter";
import {
  getAssetUrlByPath,
  getBoardsBatch,
  getBoardset,
  openBoardsDB,
} from "@features/board/db/boards-db";
import { obfToBoard } from "@features/board/mappers/obf-mapper";
import type { Board, BoardButton } from "@features/board/types";
import { useEffect, useState } from "react";
import type { MessagePart } from "./useMessage";
import { useMessage } from "./useMessage";
import { useNavigation } from "./useNavigation";
import { useSuggestions } from "./useSuggestions";

/**
 * Options for configuring the communication board hook.
 */
export interface UseCommunicationBoardOptions {
  /** The board set identifier */
  setId: string;
  /** The initial board identifier to load */
  boardId: string;
}

/**
 * Return value of the useCommunicationBoard hook.
 * Provides a flat, modern API for managing communication board state and interactions.
 */
export interface UseCommunicationBoardReturn {
  // Board
  board: Board | null;
  boardStatus: 'idle' | 'loading' | 'success' | 'error';
  boardError: string | null;
  loadBoard: (boardId: string) => Promise<void>;
  
  // Message
  message: MessagePart[];
  messageStatus: 'idle' | 'playing' | 'error';
  addMessage: (part: MessagePart) => void;
  removeLastMessage: () => void;
  clearMessages: () => void;
  playMessage: () => Promise<void>;
  
  // Navigation
  navigationHistory: string[];
  canGoBack: boolean;
  navigateToBoard: (id: string) => void;
  navigateBack: () => void;
  navigateHome: () => void;
  
  // Suggestions
  suggestions: string[];
  suggestionsStatus: 'idle' | 'generating' | 'ready' | 'error';
  suggestionsError: string | null;
  suggestionTone: RewriterTone;
  setSuggestionTone: (tone: RewriterTone) => void;
  
  // Interaction
  handleButtonClick: (button: BoardButton) => void;
}

/**
 * Hook for managing communication board state and interactions.
 *
 * Provides a flat, modern API following React best practices (2024) for:
 * - Loading and displaying boards from IndexedDB
 * - Building messages from board button selections
 * - Generating AI-powered suggestions with configurable tone
 * - Navigation between boards with history tracking
 * - Playing messages with speech synthesis and audio
 *
 * @example
 * Basic usage with flat destructuring:
 * ```tsx
 * function CommunicationBoard() {
 *   const {
 *     board,
 *     boardStatus,
 *     message,
 *     addMessage,
 *     handleButtonClick
 *   } = useCommunicationBoard({ setId: 'my-set', boardId: 'main' });
 *
 *   if (boardStatus === 'loading') return <Spinner />;
 *   if (!board) return null;
 *
 *   return (
 *     <Grid items={board.buttons} onClick={handleButtonClick} />
 *   );
 * }
 * ```
 *
 * @example
 * Using message features:
 * ```tsx
 * const { message, messageStatus, clearMessages, playMessage } = useCommunicationBoard(options);
 *
 * return (
 *   <div>
 *     {message.map(part => <Chip label={part.label} />)}
 *     <Button onClick={clearMessages}>Clear</Button>
 *     <Button onClick={playMessage} disabled={messageStatus === 'playing'}>
 *       Play
 *     </Button>
 *   </div>
 * );
 * ```
 *
 * @example
 * Working with suggestions:
 * ```tsx
 * const {
 *   suggestions,
 *   suggestionsStatus,
 *   suggestionTone,
 *   setSuggestionTone
 * } = useCommunicationBoard(options);
 *
 * return (
 *   <div>
 *     <ToneSelector value={suggestionTone} onChange={setSuggestionTone} />
 *     {suggestionsStatus === 'generating' && <Spinner />}
 *     {suggestions.map(s => <Chip label={s} />)}
 *   </div>
 * );
 * ```
 *
 * @param options - Configuration options
 * @param options.setId - Board set identifier (required)
 * @param options.boardId - Initial board identifier to load (required)
 * @returns Flat object with all board state and actions
 *
 * @remarks
 * This hook follows modern React patterns:
 * - Minimal state (no derived data)
 * - Consistent naming (action verbs, status suffixes)
 * - Flat structure (easy destructuring)
 * - Predictable async patterns (*Status, *Error)
 * - Co-located state with actions
 *
 * The board loads automatically on mount and can be manually reloaded using `loadBoard()`.
 */
export function useCommunicationBoard(
  options: UseCommunicationBoardOptions
): UseCommunicationBoardReturn {
  const { setId, boardId } = options;

  const [board, setBoard] = useState<Board | null>(null);
  const [boardStatus, setBoardStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [boardError, setBoardError] = useState<string | null>(null);
  const [rootBoardId, setRootBoardId] = useState<string>(boardId);

  const navigationHook = useNavigation({ rootBoardId });
  const messageHook = useMessage();
  const speech = useSpeech();
  const audio = useAudio();

  const suggestionsHook = useSuggestions({
    expectedInputLanguages: ["en"],
    messageParts: messageHook.message,
    context: board?.buttons,
  });

  const handleButtonClick = (button: BoardButton) => {
    if (button.loadBoard && setId) {
      if (button.loadBoard.id) {
        navigationHook.navigateToBoard(button.loadBoard.id);
        return;
      }
    }

    const hasActions = Boolean(button.actions?.length);

    if (hasActions) {
      return;
    }

    messageHook.addMessage({
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
    setBoardStatus('loading');
    setBoardError(null);

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
        setBoardStatus('success');
      } finally {
        db.close();
      }
    } catch (err) {
      console.error("Error loading board:", err);
      setBoardError(err instanceof Error ? err.message : "Failed to load board");
      setBoardStatus('error');
    }
  };

  // Load board from IndexedDB on mount and fetch root board ID
  useEffect(() => {
    async function loadFromDB() {
      setBoardStatus('loading');
      setBoardError(null);

      try {
        const db = await openBoardsDB();

        try {
          // Fetch the board set to get the actual root board ID
          const boardset = await getBoardset(db, setId);
          if (boardset?.rootBoardId) {
            setRootBoardId(boardset.rootBoardId);
          }

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

          const board = obfToBoard(obfBoard);
          setBoard(board);
          setBoardStatus('success');
        } finally {
          db.close();
        }
      } catch (err) {
        console.error("Error loading board:", err);
        setBoardError(
          err instanceof Error ? err.message : "Failed to load board"
        );
        setBoardStatus('error');
      }
    }

    loadFromDB();
  }, [setId, boardId]);

  return {
    // Board
    board,
    boardStatus,
    boardError,
    loadBoard,
    
    // Message
    message: messageHook.message,
    messageStatus: messageHook.messageStatus,
    addMessage: messageHook.addMessage,
    removeLastMessage: messageHook.removeLastMessage,
    clearMessages: messageHook.clearMessages,
    playMessage: messageHook.playMessage,
    
    // Navigation
    navigationHistory: navigationHook.navigationHistory,
    canGoBack: navigationHook.canGoBack,
    navigateToBoard: navigationHook.navigateToBoard,
    navigateBack: navigationHook.navigateBack,
    navigateHome: navigationHook.navigateHome,
    
    // Suggestions
    suggestions: suggestionsHook.suggestions,
    suggestionsStatus: suggestionsHook.suggestionsStatus,
    suggestionsError: suggestionsHook.suggestionsError,
    suggestionTone: suggestionsHook.suggestionTone,
    setSuggestionTone: suggestionsHook.setSuggestionTone,
    
    // Interaction
    handleButtonClick,
  };
}

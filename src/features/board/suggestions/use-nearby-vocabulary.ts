import {
  type Board,
  findBoardInLanguage,
  loadStoredBoard,
  loadStoredBoardTexts,
} from "@features/library";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useCommunicationLanguage } from "@shared/language/language-store";
import { createTilePart } from "../message/message-transforms";
import type { TilePart } from "../message/message-types";
import { useBoardRoute } from "../navigation/use-board-route";
import { nearbyVocabulary, type WordTile } from "./nearby-vocabulary";

interface UseNearbyVocabularyOptions {
  board: Board;
  /** The language the board's text is in, when known. */
  boardLanguage: string | undefined;
  rootBoardId: string | undefined;
}

interface UseNearbyVocabularyReturn {
  /** Empty until the nearby boards are read, so a prediction never starts from half a word list. */
  words: readonly string[];
  loadTileParts: (words: readonly string[]) => Promise<TilePart[]>;
}

/**
 * The words a suggestion may add: those on the board in view, on the boards
 * its folders open, and on the main board, which Home reaches in one tap.
 */
export function useNearbyVocabulary({
  board,
  boardLanguage,
  rootBoardId,
}: UseNearbyVocabularyOptions): UseNearbyVocabularyReturn {
  const { boardSetId } = useBoardRoute();
  const { language } = useCommunicationLanguage();

  const nearbyBoardIds = collectNearbyBoardIds(board, rootBoardId);
  const nearbyBoards = useLatestAsync({
    deps: [boardSetId, language, ...nearbyBoardIds],
    run: boardSetId
      ? async (signal) => {
          const boards = await loadStoredBoardTexts(
            boardSetId,
            nearbyBoardIds,
            signal,
          );

          return boards.map((nearby) => inLanguage(nearby, language));
        }
      : undefined,
  });

  // Nearby boards that cannot be read leave the board in view to predict from.
  const loadedBoards = nearbyBoards.error ? [] : nearbyBoards.value;
  const vocabulary = loadedBoards
    ? nearbyVocabulary(board, loadedBoards)
    : undefined;

  async function loadTileParts(words: readonly string[]): Promise<TilePart[]> {
    const tiles = words.flatMap((word) => vocabulary?.get(word) ?? []);

    return Promise.all(tiles.map((tile) => loadTilePart(tile)));
  }

  // The nearby boards were read as text, so a tile from one of them still
  // needs its picture and sound.
  async function loadTilePart({ boardId, button }: WordTile) {
    if (boardId === board.id || !boardSetId) {
      return toTilePart(button, boardLanguage);
    }

    const owner = await loadStoredBoard({ boardSetId, boardId }).catch(
      () => undefined,
    );
    const ownerButton = owner
      ? inLanguage(owner, language).buttons.find(({ id }) => id === button.id)
      : undefined;

    return toTilePart(ownerButton ?? button, boardLanguage);
  }

  return { words: vocabulary ? [...vocabulary.keys()] : [], loadTileParts };
}

function collectNearbyBoardIds(
  board: Board,
  rootBoardId: string | undefined,
): string[] {
  const boardIds = new Set(
    board.buttons.flatMap((button) => button.linkedBoardId ?? []),
  );
  if (rootBoardId) {
    boardIds.add(rootBoardId);
  }
  boardIds.delete(board.id);

  return [...boardIds];
}

function inLanguage(board: Board, language: string): Board {
  return findBoardInLanguage(board, language) ?? board;
}

function toTilePart(
  button: WordTile["button"],
  language: string | undefined,
): TilePart {
  return createTilePart({
    label: button.label,
    vocalization: button.vocalization,
    imageSrc: button.imageSrc,
    soundSrc: button.soundSrc,
    language,
  });
}

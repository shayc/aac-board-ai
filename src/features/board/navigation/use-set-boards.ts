import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import { findTranslations } from "../translation/board-strings";
import { listBoards } from "../storage/boards-db";

export interface UseSetBoardsOptions {
  setId: string;
}

export interface BoardSwitcherItem {
  boardId: string;
  name: string;
}

export interface UseSetBoardsReturn {
  boards: BoardSwitcherItem[];
  isLoading: boolean;
  error: Error | undefined;
}

export function useSetBoards({
  setId,
}: UseSetBoardsOptions): UseSetBoardsReturn {
  const { language } = useLanguage();
  const { value, error, isPending } = useLatestAsync({
    enabled: true,
    deps: [setId],
    fetch: () => listBoards(setId),
  });

  const records = value ?? [];

  const boards = records.map((record) => {
    const translated = findTranslations(record.obf.strings, language)?.[
      record.name
    ];

    return { boardId: record.boardId, name: translated ?? record.name };
  });

  return {
    boards: boards.sort((a, b) => a.name.localeCompare(b.name, language)),
    isLoading: isPending,
    error,
  };
}

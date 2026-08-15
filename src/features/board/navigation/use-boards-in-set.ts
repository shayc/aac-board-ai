import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import { listBoards } from "../storage/board-content-storage";
import { findTranslations } from "../translation/board-strings";

interface BoardSummary {
  boardId: string;
  name: string;
}

interface UseBoardsInSetReturn {
  boards: BoardSummary[];
  isLoading: boolean;
  error: Error | undefined;
}

export function useBoardsInSet(
  setId: string | undefined,
): UseBoardsInSetReturn {
  const { language } = useLanguage();
  const { value, error, isPending } = useLatestAsync({
    enabled: setId !== undefined,
    deps: [setId ?? ""],
    run: () => (setId === undefined ? Promise.resolve([]) : listBoards(setId)),
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

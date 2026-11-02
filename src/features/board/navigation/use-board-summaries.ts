import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import { listBoardRecords } from "../storage/board-content-storage";
import { findTranslations } from "../translation/board-translations";

interface BoardSummary {
  id: string;
  name: string;
}

interface UseBoardSummariesReturn {
  boards: BoardSummary[];
  isLoading: boolean;
  error: Error | undefined;
}

export function useBoardSummaries(
  boardSetId: string | undefined,
): UseBoardSummariesReturn {
  const { language } = useLanguage();
  const { value, error, isPending } = useLatestAsync({
    enabled: boardSetId !== undefined,
    deps: [boardSetId ?? ""],
    run: () =>
      boardSetId === undefined
        ? Promise.resolve([])
        : listBoardRecords(boardSetId),
  });

  const records = value ?? [];

  const boards = records.map((record) => {
    const translated = findTranslations(record.obf.strings ?? {}, language)?.[
      record.name
    ];

    return { id: record.id, name: translated ?? record.name };
  });

  return {
    boards: boards.sort((a, b) => a.name.localeCompare(b.name, language)),
    isLoading: isPending,
    error,
  };
}

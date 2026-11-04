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
    run: async () => {
      if (boardSetId === undefined) {
        return [];
      }

      const records = await listBoardRecords(boardSetId);

      return records.map(({ id, name, obf }) => ({
        id,
        name,
        strings: obf.strings ?? {},
      }));
    },
  });

  const untranslatedBoards = value ?? [];

  const boards = untranslatedBoards
    .map(({ id, name, strings }) => ({
      id,
      name: findTranslations(strings, language)?.[name] ?? name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, language));

  return {
    boards,
    isLoading: isPending,
    error,
  };
}

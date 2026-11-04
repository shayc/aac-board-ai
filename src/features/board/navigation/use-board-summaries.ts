import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import {
  listBoardSummaries,
  type BoardSummary,
} from "../storage/list-board-summaries";
import { findTranslations } from "../translation/board-translations";

interface UseBoardSummariesReturn {
  boards: Pick<BoardSummary, "id" | "name">[];
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
    run: async () =>
      boardSetId === undefined ? [] : listBoardSummaries(boardSetId),
  });

  const boards = (value ?? [])
    .map(({ id, name, translations }) => ({
      id,
      name: findTranslations(translations, language)?.[name] ?? name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, language));

  return {
    boards,
    isLoading: isPending,
    error,
  };
}

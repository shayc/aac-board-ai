import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import { listBoardSummaries } from "../storage/list-board-summaries";
import { findTranslations } from "../translation/board-translations";

interface BoardOption {
  id: string;
  name: string;
}

export function useBoardOptions(boardSetId: string | undefined): BoardOption[] {
  const { language } = useLanguage();
  const { value: summaries = [] } = useLatestAsync({
    enabled: boardSetId !== undefined,
    deps: [boardSetId ?? ""],
    run: async () =>
      boardSetId === undefined ? [] : listBoardSummaries(boardSetId),
  });

  return summaries
    .map(({ id, name, translations }) => ({
      id,
      name: findTranslations(translations, language)?.[name] ?? name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, language));
}

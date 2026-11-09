import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import { listBoardSummaries } from "../storage/list-board-summaries";
import { findStringTranslations } from "../translation/board-translations";

interface BoardOption {
  id: string;
  name: string;
}

export function useBoardOptions(boardSetId: string | undefined): BoardOption[] {
  const { language } = useLanguage();
  const { value: summaries = [] } = useLatestAsync({
    deps: [boardSetId],
    run:
      boardSetId === undefined
        ? undefined
        : () => listBoardSummaries(boardSetId),
  });

  return summaries
    .map(({ id, name, translationsByLocale }) => ({
      id,
      name:
        findStringTranslations(translationsByLocale, language)?.get(name) ??
        name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, language));
}

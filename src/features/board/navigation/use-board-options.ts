import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import { listBoardSummaries } from "../storage/list-board-summaries";
import { findStringTranslations } from "../translation/board-translations";

export interface BoardOption {
  id: string;
  name: string;
}

export function useBoardOptions(
  boardSetId: string | undefined,
  currentBoard: BoardOption,
): BoardOption[] {
  const { language } = useLanguage();
  const { value: summaries = [] } = useLatestAsync({
    enabled: boardSetId !== undefined,
    deps: [boardSetId ?? "", currentBoard.id, language],
    run: async () =>
      boardSetId === undefined ? [] : listBoardSummaries(boardSetId),
  });

  const otherBoards = summaries
    .filter(({ id }) => id !== currentBoard.id)
    .map(({ id, name, translationsByLocale }) => ({
      id,
      name:
        findStringTranslations(translationsByLocale, language)?.[name] ?? name,
    }));

  return [currentBoard, ...otherBoards].sort((a, b) =>
    a.name.localeCompare(b.name, language),
  );
}

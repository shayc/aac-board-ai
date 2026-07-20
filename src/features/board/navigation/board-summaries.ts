import { listBoards } from "../storage/boards-db";
import { findTranslations } from "../translation/board-strings";

export interface BoardSummary {
  boardId: string;
  name: string;
}

export async function loadBoardSummaries(
  setId: string,
  language: string,
  signal?: AbortSignal,
): Promise<BoardSummary[]> {
  const records = await listBoards(setId);
  signal?.throwIfAborted();

  const summaries = records.map((record) => {
    const translatedName = findTranslations(record.obf.strings, language)?.[
      record.name
    ];

    return {
      boardId: record.boardId,
      name: translatedName ?? record.name,
    };
  });

  return summaries.sort((a, b) => a.name.localeCompare(b.name, language));
}

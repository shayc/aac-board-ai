import { createTranslator } from "@shayc/react-built-in-ai";
import { saveBoardSetNameTranslations } from "../board-sets/board-sets-store";
import { obfToBoard } from "../obf/obf-to-board";
import { getBoardRecord } from "../storage/board-content-storage";
import type { BoardSetRecord } from "../storage/board-set-storage";
import { findTextInLanguage, getBoardLanguage } from "./board-translations";

export async function translateBoardSetNames(
  boardSets: readonly BoardSetRecord[],
  language: string,
  signal: AbortSignal,
): Promise<void> {
  const names = new Map<string, string>();
  const untranslated: BoardSetRecord[] = [];

  for (const boardSet of boardSets) {
    if (!needsNameTranslation(boardSet, language)) {
      continue;
    }

    const nameInLanguage = await findNameWithoutTranslator(boardSet, language);

    if (nameInLanguage === undefined) {
      untranslated.push(boardSet);
    } else {
      names.set(boardSet.id, nameInLanguage);
    }
  }

  for (const [sourceLanguage, group] of Map.groupBy(
    untranslated,
    getBoardLanguage,
  )) {
    try {
      await using translator = await createTranslator({
        sourceLanguage,
        targetLanguage: language,
        signal,
      });

      for (const { id, name } of group) {
        names.set(id, await translator.translate(name, { signal }));
      }
    } catch {
      signal.throwIfAborted();
    }
  }

  if (names.size > 0) {
    await saveBoardSetNameTranslations(language, names);
  }
}

function needsNameTranslation(
  boardSet: BoardSetRecord,
  language: string,
): boolean {
  return (
    getBoardLanguage(boardSet) !== language &&
    boardSet.nameTranslations?.[language] === undefined
  );
}

async function findNameWithoutTranslator(
  boardSet: BoardSetRecord,
  language: string,
): Promise<string | undefined> {
  const rootRecord = await getBoardRecord(boardSet.id, boardSet.rootBoardId);
  const rootBoard = rootRecord && obfToBoard(rootRecord.obf);

  if (rootBoard?.name !== boardSet.name) {
    return boardSet.name;
  }

  return findTextInLanguage(
    rootBoard.translationsByLocale,
    language,
    boardSet.name,
  );
}

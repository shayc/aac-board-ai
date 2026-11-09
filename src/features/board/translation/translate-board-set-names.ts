import { createTranslator } from "@shayc/react-built-in-ai";
import { saveBoardSetNameTranslations } from "../board-sets/board-sets-store";
import { obfToBoard } from "../obf/obf-to-board";
import { getBoardRecord } from "../storage/board-content-storage";
import type { BoardSetRecord } from "../storage/board-set-storage";
import {
  findStringTranslations,
  findTranslation,
  getBoardLanguage,
} from "./board-translations";
import { translateStrings } from "./translator";

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

    const knownName = await findKnownName(boardSet, language);

    if (knownName === undefined) {
      untranslated.push(boardSet);
    } else {
      names.set(boardSet.id, knownName);
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
      const translations = await translateStrings(
        group.map(({ name }) => name),
        translator,
        signal,
      );

      for (const { id, name } of group) {
        names.set(id, translations[name]);
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

async function findKnownName(
  boardSet: BoardSetRecord,
  language: string,
): Promise<string | undefined> {
  const rootRecord = await getBoardRecord(boardSet.id, boardSet.rootBoardId);
  const rootBoard = rootRecord && obfToBoard(rootRecord.obf);

  if (rootBoard?.name !== boardSet.name) {
    return boardSet.name;
  }

  const translations = findStringTranslations(
    rootBoard.translationsByLocale,
    language,
  );

  return translations && findTranslation(translations, boardSet.name);
}

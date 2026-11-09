import {
  listBoardSets,
  saveBoardSetNameTranslations,
} from "../board-sets/board-sets-store";
import { obfToBoard } from "../obf/obf-to-board";
import { getBoardRecord } from "../storage/board-content-storage";
import type { BoardSetRecord } from "../storage/board-set-storage";
import {
  findStringTranslations,
  findTranslation,
  getBoardLanguage,
} from "./board-translations";
import { translateStrings, withTranslator } from "./translator";

export async function translateBoardSetNames(
  language: string,
  signal: AbortSignal,
): Promise<void> {
  const boardSets = (await listBoardSets()).filter(
    (boardSet) =>
      getBoardLanguage(boardSet) !== language &&
      boardSet.nameTranslations?.[language] === undefined,
  );

  if (boardSets.length === 0) {
    return;
  }

  const names = new Map<string, string>();
  const untranslated: BoardSetRecord[] = [];

  for (const boardSet of boardSets) {
    const knownName = await findKnownName(boardSet, language);

    if (knownName === undefined) {
      untranslated.push(boardSet);
    } else {
      names.set(boardSet.id, knownName);
    }
  }

  try {
    for (const [sourceLanguage, group] of Map.groupBy(
      untranslated,
      getBoardLanguage,
    )) {
      const translations = await withTranslator(
        { sourceLanguage, targetLanguage: language, signal },
        (translator) =>
          translateStrings(
            group.map(({ name }) => name),
            translator,
            signal,
          ),
      );

      for (const { id, name } of group) {
        names.set(id, translations[name]);
      }
    }
  } catch {
    signal.throwIfAborted();
  }

  if (names.size > 0) {
    await saveBoardSetNameTranslations(language, names);
  }
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

import { createTranslator, isSupported } from "@shayc/react-built-in-ai";
import type { Board, StringTranslations } from "../board-types";
import { obfToBoard } from "../obf/obf-to-board";
import { listBoardRecords } from "../storage/board-content-storage";
import {
  saveBoardSetTranslations,
  type BoardSetRecord,
} from "../storage/board-set-storage";
import {
  collectBoardStrings,
  findStringTranslations,
  getBoardLanguage,
} from "./board-translations";

interface TranslateBoardSetsOptions {
  signal: AbortSignal;
  onTranslated: (boardSetId: string) => void;
}

type OpenTranslator = Awaited<ReturnType<typeof createTranslator>>;

/**
 * Translates every board set not yet in `language` and saves the result.
 * Never rejects: a set that fails stays in its source language until the next
 * run, and an abort stops between sets.
 */
export async function translateBoardSets(
  boardSets: readonly BoardSetRecord[],
  language: string,
  { signal, onTranslated }: TranslateBoardSetsOptions,
): Promise<void> {
  if (!isSupported("Translator")) {
    return;
  }

  for (const boardSet of boardSets) {
    if (signal.aborted) {
      return;
    }

    if (isBoardSetInLanguage(boardSet, language)) {
      continue;
    }

    try {
      await translateBoardSet(boardSet, language, signal);
      onTranslated(boardSet.id);
    } catch {
      // Translation is optional; the next language change or app start retries.
    }
  }
}

// The set name is saved in the same transaction as its boards' translations,
// so it marks the whole set as translated without reading any board.
function isBoardSetInLanguage(
  boardSet: BoardSetRecord,
  language: string,
): boolean {
  return (
    getBoardLanguage(boardSet) === language ||
    boardSet.translatedNames?.[language] !== undefined
  );
}

async function translateBoardSet(
  boardSet: BoardSetRecord,
  language: string,
  signal: AbortSignal,
): Promise<void> {
  const translators = new Map<string, OpenTranslator>();

  async function openTranslator(sourceLanguage: string) {
    const translator = await createTranslator({
      sourceLanguage,
      targetLanguage: language,
      signal,
    });

    translators.set(sourceLanguage, translator);
  }

  try {
    // Opened before any board is read: a refused translator (model not
    // downloaded, unsupported language) repeats on every run until it works.
    await openTranslator(getBoardLanguage(boardSet));

    const boards = await listBoardsMissingLanguage(boardSet.id, language);
    const stringsBySourceLanguage = collectStringsBySourceLanguage(
      boardSet,
      boards,
    );

    for (const sourceLanguage of stringsBySourceLanguage.keys()) {
      if (!translators.has(sourceLanguage)) {
        await openTranslator(sourceLanguage);
      }
    }

    const translationsBySourceLanguage = await translateBySourceLanguage(
      stringsBySourceLanguage,
      translators,
      signal,
    );

    signal.throwIfAborted();

    await saveBoardSetTranslations(
      boardSet.id,
      language,
      pickBoardSetTranslations(boardSet, boards, translationsBySourceLanguage),
    );
  } finally {
    for (const translator of translators.values()) {
      translator.destroy();
    }
  }
}

async function listBoardsMissingLanguage(
  boardSetId: string,
  language: string,
): Promise<Board[]> {
  const records = await listBoardRecords(boardSetId);

  return records
    .map(({ obf }) => obfToBoard(obf))
    .filter((board) => !isBoardInLanguage(board, language));
}

function isBoardInLanguage(board: Board, language: string): boolean {
  return (
    getBoardLanguage(board) === language ||
    findStringTranslations(board.translationsByLocale, language) !== undefined
  );
}

function collectStringsBySourceLanguage(
  boardSet: BoardSetRecord,
  boards: readonly Board[],
): Map<string, Set<string>> {
  const stringsBySourceLanguage = new Map<string, Set<string>>();

  function addStrings(sourceLanguage: string, strings: Iterable<string>) {
    const collected = stringsBySourceLanguage.get(sourceLanguage) ?? new Set();
    for (const text of strings) {
      collected.add(text);
    }

    stringsBySourceLanguage.set(sourceLanguage, collected);
  }

  addStrings(getBoardLanguage(boardSet), [boardSet.name]);
  for (const board of boards) {
    addStrings(getBoardLanguage(board), collectBoardStrings(board));
  }

  return stringsBySourceLanguage;
}

async function translateBySourceLanguage(
  stringsBySourceLanguage: ReadonlyMap<string, Set<string>>,
  translators: ReadonlyMap<string, OpenTranslator>,
  signal: AbortSignal,
): Promise<Map<string, StringTranslations>> {
  const entries = await Promise.all(
    Array.from(translators, async ([sourceLanguage, translator]) => {
      const strings = stringsBySourceLanguage.get(sourceLanguage) ?? [];
      const translations = await translateStrings(strings, translator, signal);

      return [sourceLanguage, translations] as const;
    }),
  );

  return new Map(entries);
}

async function translateStrings(
  strings: Iterable<string>,
  translator: OpenTranslator,
  signal: AbortSignal,
): Promise<StringTranslations> {
  const entries = await Promise.all(
    Array.from(strings, async (text) => {
      const translated = await translator.translate(text, { signal });

      return [text, translated] as const;
    }),
  );

  return new Map(entries);
}

function pickBoardSetTranslations(
  boardSet: BoardSetRecord,
  boards: readonly Board[],
  translationsBySourceLanguage: ReadonlyMap<string, StringTranslations>,
) {
  function translationsFor(source: { locale?: string }) {
    return translationsBySourceLanguage.get(getBoardLanguage(source));
  }

  return {
    name: translationsFor(boardSet)?.get(boardSet.name) ?? boardSet.name,
    stringsByBoardId: new Map(
      boards.map((board) => [
        board.id,
        pickBoardTranslations(board, translationsFor(board)),
      ]),
    ),
  };
}

function pickBoardTranslations(
  board: Board,
  translations: StringTranslations | undefined,
): StringTranslations {
  return new Map(
    Array.from(collectBoardStrings(board), (text) => [
      text,
      translations?.get(text) ?? text,
    ]),
  );
}

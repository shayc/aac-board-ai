import { createTranslator } from "@shayc/react-built-in-ai";
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

interface TranslationOptions {
  signal: AbortSignal;
  onTranslating: () => void;
}

interface TranslateBoardSetsOptions extends TranslationOptions {
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
  { signal, onTranslating, onTranslated }: TranslateBoardSetsOptions,
): Promise<void> {
  for (const boardSet of boardSets) {
    if (signal.aborted) {
      return;
    }

    if (isBoardSetInLanguage(boardSet, language)) {
      continue;
    }

    try {
      await translateBoardSet(boardSet, language, { signal, onTranslating });
      onTranslated(boardSet.id);
    } catch {
      // Translation is optional; the next language change or app start retries.
    }
  }
}

// The set name is saved in the same transaction as its boards' translations,
// so it marks the whole set as translated without reading any board. A set's
// own language doesn't: it is only its root board's, and other boards may
// differ.
function isBoardSetInLanguage(
  boardSet: BoardSetRecord,
  language: string,
): boolean {
  return boardSet.translatedNames?.[language] !== undefined;
}

async function translateBoardSet(
  boardSet: BoardSetRecord,
  language: string,
  { signal, onTranslating }: TranslationOptions,
): Promise<void> {
  const boards = await listBoards(boardSet.id);
  const nameInLanguage = findNameInLanguage(boardSet, boards, language);
  const boardsMissingLanguage = boards.filter(
    (board) => !isBoardInLanguage(board, language),
  );

  const stringsBySourceLanguage = collectStringsBySourceLanguage(
    boardsMissingLanguage,
  );
  if (nameInLanguage === undefined) {
    addStrings(stringsBySourceLanguage, getBoardLanguage(boardSet), [
      boardSet.name,
    ]);
  }

  // Without the Translator API, createTranslator rejects, so only a set whose
  // file ships every translation is saved.
  const translationsBySourceLanguage = await translateBySourceLanguage(
    stringsBySourceLanguage,
    language,
    { signal, onTranslating },
  );

  signal.throwIfAborted();

  await saveBoardSetTranslations(
    boardSet.id,
    language,
    pickBoardSetTranslations({
      boardSet,
      nameInLanguage,
      boards: boardsMissingLanguage,
      translationsBySourceLanguage,
    }),
  );
}

async function listBoards(boardSetId: string): Promise<Board[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ obf }) => obfToBoard(obf));
}

// The set name usually comes from its root board's name, so a board file that
// ships translations already has the name in the language.
function findNameInLanguage(
  boardSet: BoardSetRecord,
  boards: readonly Board[],
  language: string,
): string | undefined {
  if (getBoardLanguage(boardSet) === language) {
    return boardSet.name;
  }

  const rootBoard = boards.find((board) => board.id === boardSet.rootBoardId);
  if (!rootBoard) {
    return undefined;
  }

  return findStringTranslations(rootBoard.translationsByLocale, language)?.get(
    boardSet.name,
  );
}

function isBoardInLanguage(board: Board, language: string): boolean {
  return (
    getBoardLanguage(board) === language ||
    findStringTranslations(board.translationsByLocale, language) !== undefined
  );
}

function collectStringsBySourceLanguage(
  boards: readonly Board[],
): Map<string, Set<string>> {
  const stringsBySourceLanguage = new Map<string, Set<string>>();
  for (const board of boards) {
    addStrings(
      stringsBySourceLanguage,
      getBoardLanguage(board),
      collectBoardStrings(board),
    );
  }

  return stringsBySourceLanguage;
}

function addStrings(
  stringsBySourceLanguage: Map<string, Set<string>>,
  sourceLanguage: string,
  strings: Iterable<string>,
) {
  const collected = stringsBySourceLanguage.get(sourceLanguage) ?? new Set();
  for (const text of strings) {
    collected.add(text);
  }

  stringsBySourceLanguage.set(sourceLanguage, collected);
}

async function translateBySourceLanguage(
  stringsBySourceLanguage: ReadonlyMap<string, Set<string>>,
  targetLanguage: string,
  { signal, onTranslating }: TranslationOptions,
): Promise<Map<string, StringTranslations>> {
  if (stringsBySourceLanguage.size === 0) {
    return new Map();
  }

  const translators = new Map<string, OpenTranslator>();

  try {
    // Every translator opens before any string is translated, so a refused
    // one (model not downloaded, unsupported pair) wastes no translation.
    for (const sourceLanguage of stringsBySourceLanguage.keys()) {
      const translator = await createTranslator({
        sourceLanguage,
        targetLanguage,
        signal,
      });
      translators.set(sourceLanguage, translator);
    }

    // Reported only now, so a model download shows as downloading rather
    // than as translating.
    onTranslating();

    const entries = await Promise.all(
      Array.from(translators, async ([sourceLanguage, translator]) => {
        const strings = stringsBySourceLanguage.get(sourceLanguage) ?? [];
        const translations = await translateStrings(
          strings,
          translator,
          signal,
        );

        return [sourceLanguage, translations] as const;
      }),
    );

    return new Map(entries);
  } finally {
    for (const translator of translators.values()) {
      translator.destroy();
    }
  }
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

interface PickBoardSetTranslationsInput {
  boardSet: BoardSetRecord;
  nameInLanguage: string | undefined;
  boards: readonly Board[];
  translationsBySourceLanguage: ReadonlyMap<string, StringTranslations>;
}

function pickBoardSetTranslations({
  boardSet,
  nameInLanguage,
  boards,
  translationsBySourceLanguage,
}: PickBoardSetTranslationsInput) {
  function translationsFor(source: { locale?: string }) {
    return translationsBySourceLanguage.get(getBoardLanguage(source));
  }

  const translatedName = translationsFor(boardSet)?.get(boardSet.name);

  return {
    name: nameInLanguage ?? translatedName ?? boardSet.name,
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

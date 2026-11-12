import { createTranslator } from "@shayc/react-built-in-ai";
import type { Board, StringTranslations } from "../board-types";
import { obfToBoard } from "../obf/obf-to-board";
import { listBoardRecords } from "../storage/board-content-storage";
import {
  type BoardSetRecord,
  saveBoardSetTranslations,
} from "../storage/board-set-storage";
import {
  collectBoardStrings,
  findStringTranslations,
  getSourceLanguage,
} from "./board-translations";

export interface TranslationPassOptions {
  signal: AbortSignal;
  onTranslating: () => void;
}

interface TranslateBoardSetsOptions extends TranslationPassOptions {
  onTranslated: (boardSetId: string) => void;
}

type OpenTranslator = Awaited<ReturnType<typeof createTranslator>>;

/** Translator failures skip a set. Storage and other errors reject. */
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

    const isTranslated = await translateBoardSet(boardSet, language, {
      signal,
      onTranslating,
    });
    if (isTranslated) {
      onTranslated(boardSet.id);
    }
  }
}

// The name and all board translations commit atomically, making it a completion marker.
// The set's locale describes only its root board.
function isBoardSetInLanguage(
  boardSet: BoardSetRecord,
  language: string,
): boolean {
  return boardSet.translatedNames?.[language] !== undefined;
}

async function translateBoardSet(
  boardSet: BoardSetRecord,
  language: string,
  { signal, onTranslating }: TranslationPassOptions,
): Promise<boolean> {
  const boards = await listBoards(boardSet.id);
  const nameInLanguage = findNameInLanguage(boardSet, boards, language);
  const boardsMissingLanguage = boards.filter(
    (board) => !isBoardInLanguage(board, language),
  );

  const stringsBySourceLanguage = collectStringsBySourceLanguage(
    boardsMissingLanguage,
  );
  if (nameInLanguage === undefined) {
    addStrings(stringsBySourceLanguage, getSourceLanguage(boardSet), [
      boardSet.name,
    ]);
  }

  // Optional AI failures leave the set available for a later retry.
  const translationsBySourceLanguage = await translateBySourceLanguage(
    stringsBySourceLanguage,
    language,
    { signal, onTranslating },
  ).catch(() => undefined);
  if (!translationsBySourceLanguage || signal.aborted) {
    return false;
  }

  const findTranslation = (source: { locale?: string }, text: string) =>
    translationsBySourceLanguage.get(getSourceLanguage(source))?.get(text) ??
    text;

  await saveBoardSetTranslations(boardSet.id, language, {
    name: nameInLanguage ?? findTranslation(boardSet, boardSet.name),
    translationsByBoardId: new Map(
      boardsMissingLanguage.map((board) => [
        board.id,
        pickBoardTranslations(board, findTranslation),
      ]),
    ),
  });

  return true;
}

async function listBoards(boardSetId: string): Promise<Board[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ obf }) => obfToBoard(obf));
}

function findNameInLanguage(
  boardSet: BoardSetRecord,
  boards: readonly Board[],
  language: string,
): string | undefined {
  if (getSourceLanguage(boardSet) === language) {
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
    getSourceLanguage(board) === language ||
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
      getSourceLanguage(board),
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
  { signal, onTranslating }: TranslationPassOptions,
): Promise<Map<string, StringTranslations>> {
  if (stringsBySourceLanguage.size === 0) {
    return new Map();
  }

  const translators = new Map<string, OpenTranslator>();

  try {
    // Open every translator first so a refused one wastes no translation.
    for (const sourceLanguage of stringsBySourceLanguage.keys()) {
      const translator = await createTranslator({
        sourceLanguage,
        targetLanguage,
        signal,
        // Keep translation status active across the model-download handoff.
        onDownloadProgress: onTranslating,
      });
      translators.set(sourceLanguage, translator);
    }

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

function pickBoardTranslations(
  board: Board,
  findTranslation: (board: Board, text: string) => string,
): StringTranslations {
  return new Map(
    Array.from(collectBoardStrings(board), (text) => [
      text,
      findTranslation(board, text),
    ]),
  );
}

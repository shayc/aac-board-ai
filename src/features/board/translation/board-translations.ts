import { normalizeLocale } from "@shared/utils/locale";
import type { OBFBoard } from "@shayc/open-board-format";
import type { Board } from "../types";

export interface ResolvedPhrase {
  text: string;
  language?: string;
  sourceText: string;
  sourceLanguage?: string;
  isMissing: boolean;
}

export interface BoardSummary {
  boardId: string;
  name: string;
  nameLanguage?: string;
}

export function getSourceLanguage(
  locale: string | undefined,
): string | undefined {
  if (!locale) {
    return undefined;
  }

  try {
    return new Intl.Locale(normalizeLocale(locale)).baseName;
  } catch {
    return undefined;
  }
}

export function areLanguagesCompatible(
  source: string,
  target: string,
): boolean {
  try {
    const left = new Intl.Locale(normalizeLocale(source)).maximize();
    const right = new Intl.Locale(normalizeLocale(target)).maximize();

    return left.language === right.language && left.script === right.script;
  } catch {
    return false;
  }
}

function findTranslation(
  dictionaries: OBFBoard["strings"],
  language: string | undefined,
  key: string,
): { text: string; language: string } | undefined {
  if (!dictionaries || !language) {
    return undefined;
  }

  const target = normalizeLocale(language);
  const candidates = Object.entries(dictionaries)
    .map(([locale, phrases]) => ({ locale: normalizeLocale(locale), phrases }))
    .filter(({ locale }) => areLanguagesCompatible(locale, target))
    .sort((left, right) => {
      return (
        rankLocale(left.locale, target) - rankLocale(right.locale, target) ||
        left.locale.localeCompare(right.locale, "en")
      );
    });

  for (const { locale, phrases } of candidates) {
    if (Object.hasOwn(phrases, key) && typeof phrases[key] === "string") {
      return { text: phrases[key], language: locale };
    }
  }

  return undefined;
}

function rankLocale(locale: string, target: string): number {
  if (locale === target) {
    return 0;
  }

  return locale.includes("-") ? 2 : 1;
}

export function resolvePhrase(
  source: OBFBoard,
  key: string,
  language: string,
): ResolvedPhrase {
  const sourceLanguage = getSourceLanguage(source.locale);
  const original = findTranslation(source.strings, sourceLanguage, key);
  const sourceText = original?.text ?? key;
  const translated = findTranslation(source.strings, language, key);
  const isSourceLanguage =
    sourceLanguage !== undefined &&
    areLanguagesCompatible(sourceLanguage, language);

  return {
    text: translated?.text ?? sourceText,
    language: translated?.language ?? original?.language ?? sourceLanguage,
    sourceText,
    sourceLanguage: original?.language ?? sourceLanguage,
    isMissing:
      !translated &&
      !isSourceLanguage &&
      sourceLanguage !== undefined &&
      sourceText.trim().length > 0 &&
      (original !== undefined || !key.startsWith(":")),
  };
}

export function collectBoardPhrases(
  source: OBFBoard,
  includeButtons: boolean,
  language: string,
): Map<string, ResolvedPhrase> {
  const keys = new Set<string>();
  if (source.name?.trim()) {
    keys.add(source.name);
  }

  if (includeButtons) {
    for (const button of source.buttons) {
      if (button.label) {
        keys.add(button.label);
      }
      if (button.vocalization) {
        keys.add(button.vocalization);
      }
    }
  }

  return new Map(
    [...keys].map((key) => [key, resolvePhrase(source, key, language)]),
  );
}

export function applyResolvedPhrases(
  board: Board,
  phrases: ReadonlyMap<string, ResolvedPhrase>,
): Board {
  const lookup = (key: string | undefined) =>
    key === undefined ? undefined : phrases.get(key);
  const name = lookup(board.name);

  return {
    ...board,
    translations: undefined,
    name: name?.text ?? board.name,
    nameLanguage: name?.language,
    buttons: board.buttons.map((button) => {
      const label = lookup(button.label);
      const vocalization = lookup(button.vocalization);

      return {
        ...button,
        label: label?.text ?? button.label,
        labelLanguage: label?.language,
        vocalization: vocalization?.text ?? button.vocalization,
        vocalizationLanguage: vocalization?.language,
      };
    }),
  };
}

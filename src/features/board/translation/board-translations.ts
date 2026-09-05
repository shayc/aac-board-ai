import { normalizeLocale } from "@shared/utils/locale";
import type { OBFBoard } from "@shayc/open-board-format";
import type { BoardButton } from "../types";

export interface ResolvedPhrase {
  text: string;
  language?: string;
  sourceText: string;
  sourceLanguage?: string;
  shouldTranslate: boolean;
}

export interface BoardSummary {
  boardId: string;
  name: string;
  nameLanguage?: string;
}

interface TranslationDictionary {
  locale: string;
  phrases: Record<string, string>;
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

function selectDictionaries(
  dictionaries: OBFBoard["strings"],
  language: string | undefined,
): TranslationDictionary[] {
  if (!dictionaries || !language) {
    return [];
  }

  const target = normalizeLocale(language);
  return Object.entries(dictionaries)
    .map(([locale, phrases]) => ({ locale: normalizeLocale(locale), phrases }))
    .filter(({ locale }) => areLanguagesCompatible(locale, target))
    .sort((left, right) => {
      return (
        rankLocale(left.locale, target) - rankLocale(right.locale, target) ||
        left.locale.localeCompare(right.locale, "en")
      );
    });
}

function findTranslation(
  dictionaries: readonly TranslationDictionary[],
  key: string,
): { text: string; language: string } | undefined {
  for (const { locale, phrases } of dictionaries) {
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

function createPhraseResolver(
  source: OBFBoard,
  targetLanguage: string,
): (key: string) => ResolvedPhrase {
  const sourceLanguage = getSourceLanguage(source.locale);
  const sourceDictionaries = selectDictionaries(source.strings, sourceLanguage);
  const targetDictionaries = selectDictionaries(source.strings, targetLanguage);
  const isSourceLanguage =
    sourceLanguage !== undefined &&
    areLanguagesCompatible(sourceLanguage, targetLanguage);

  return (key) => {
    const original = findTranslation(sourceDictionaries, key);
    const sourceText = original?.text ?? key;
    const translated = findTranslation(targetDictionaries, key);

    return {
      text: translated?.text ?? sourceText,
      language: translated?.language ?? original?.language ?? sourceLanguage,
      sourceText,
      sourceLanguage: original?.language ?? sourceLanguage,
      shouldTranslate:
        !translated &&
        !isSourceLanguage &&
        sourceLanguage !== undefined &&
        sourceText.trim().length > 0 &&
        (original !== undefined || !key.startsWith(":")),
    };
  };
}

export function collectBoardPhrases(
  source: OBFBoard,
  includeButtons: boolean,
  targetLanguage: string,
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

  const resolvePhrase = createPhraseResolver(source, targetLanguage);
  return new Map([...keys].map((key) => [key, resolvePhrase(key)]));
}

export function applyButtonPhrases(
  buttons: readonly BoardButton[],
  phrases: ReadonlyMap<string, ResolvedPhrase>,
): BoardButton[] {
  const lookup = (key: string | undefined) =>
    key === undefined ? undefined : phrases.get(key);

  return buttons.map((button) => {
    const label = lookup(button.label);
    const vocalization = lookup(button.vocalization);

    return {
      ...button,
      label: label?.text ?? button.label,
      labelLanguage: label?.language,
      vocalization: vocalization?.text ?? button.vocalization,
      vocalizationLanguage: vocalization?.language,
    };
  });
}

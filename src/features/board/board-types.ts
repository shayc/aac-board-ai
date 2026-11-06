export interface Board {
  id: string;
  name: string;
  locale?: string;
  grid: BoardGrid;
  buttons: BoardButton[];
  translationsByLocale: TranslationsByLocale;
}

export interface BoardGrid {
  rows: number;
  columns: number;
  order?: (string | null)[][];
}

export interface BoardButton {
  id: string;
  label: string;
  vocalization?: string;
  imageSrc?: string;
  soundSrc?: string;
  backgroundColor?: string;
  borderColor?: string;
  actions: BoardAction[];
  linkedBoardId?: string;
}

export type BoardAction =
  | { kind: "space" }
  | { kind: "backspace" }
  | { kind: "clear" }
  | { kind: "home" }
  | { kind: "speak" }
  | { kind: "spell"; text: string };

export type PhraseTranslations = Partial<Record<string, string>>;

/**
 * BCP 47 locale → phrase translations. Imported boards may key by region
 * (`es-ES`); translations cached on this device key by language code (`es`).
 */
export type TranslationsByLocale = Partial<Record<string, PhraseTranslations>>;

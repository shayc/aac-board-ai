export interface BoardKey {
  readonly boardSetId: string;
  readonly boardId: string;
}

export interface Board {
  readonly id: string;
  readonly name: string;
  readonly locale?: string;
  readonly grid: BoardGrid;
  readonly buttons: readonly BoardButton[];
  readonly translationsByLocale: TranslationsByLocale;
}

export interface BoardGrid {
  readonly rows: number;
  readonly columns: number;
  readonly order: readonly (readonly (string | null)[])[];
}

export interface BoardButton {
  readonly id: string;
  readonly label: string;
  readonly vocalization?: string;
  readonly imageSrc?: string;
  readonly soundSrc?: string;
  readonly backgroundColor?: string;
  readonly borderColor?: string;
  readonly actions: readonly BoardAction[];
  readonly linkedBoardId?: string;
}

export type BoardAction =
  | { readonly kind: "space" }
  | { readonly kind: "backspace" }
  | { readonly kind: "clear" }
  | { readonly kind: "home" }
  | { readonly kind: "play" }
  | { readonly kind: "spell"; readonly text: string };

export type StringTranslations = ReadonlyMap<string, string>;

/**
 * Imported keys may include a region (`es-ES`). Cached translations use language codes (`es`).
 */
export type TranslationsByLocale = ReadonlyMap<string, StringTranslations>;

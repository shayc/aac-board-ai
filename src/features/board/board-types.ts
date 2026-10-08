export interface Board {
  id: string;
  name?: string;
  locale?: string;
  grid: BoardGrid;
  buttons: BoardButton[];
  translations?: BoardTranslations;
}

export interface BoardGrid {
  rows: number;
  columns: number;
  order?: (string | null)[][];
}

export interface BoardButton {
  id: string;
  label?: string;
  vocalization?: string;
  imageSrc?: string;
  soundSrc?: string;
  backgroundColor?: string;
  borderColor?: string;
  actions?: BoardAction[];
  loadBoard?: LoadBoard;
}

export interface LoadBoard {
  id: string;
}

export type BoardAction =
  | { kind: "space" }
  | { kind: "backspace" }
  | { kind: "clear" }
  | { kind: "home" }
  | { kind: "speak" }
  | { kind: "spell"; text: string };

/** Target locale → original board text → translated text. */
export type BoardTranslations = Record<string, Record<string, string>>;

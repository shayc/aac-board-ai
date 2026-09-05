export interface Board {
  id: string;
  name?: string;
  nameLanguage?: string;
  locale?: string;
  grid: BoardGrid;
  buttons: BoardButton[];
}

export interface BoardGrid {
  rows: number;
  columns: number;
  order?: (string | null)[][];
}

export interface BoardButton {
  id: string;
  label?: string;
  labelLanguage?: string;
  vocalization?: string;
  vocalizationLanguage?: string;
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

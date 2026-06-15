export interface Board {
  id: string;
  name?: string;
  locale?: string;
  grid: BoardGrid;
  buttons: BoardButton[];
  description?: string;
  license?: BoardLicense;
  strings?: BoardStrings;
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
  id?: string;
  name?: string;
  url?: string;
  path?: string;
  dataUrl?: string;
}

export type BoardAction =
  | { kind: "space" }
  | { kind: "backspace" }
  | { kind: "clear" }
  | { kind: "home" }
  | { kind: "speak" }
  | { kind: "spell"; text: string };

export interface BoardLicense {
  type: string;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  sourceUrl?: string;
  copyrightNoticeUrl?: string;
}

export type BoardStrings = Record<string, Record<string, string>>;

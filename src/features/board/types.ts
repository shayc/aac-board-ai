export interface BoardRouteParams {
  [key: string]: string;
  setId: string;
  boardId: string;
}

export type Tone = RewriterTone;

type SpecialtyAction = ":space" | ":clear" | ":home" | ":speak" | ":backspace";
type SpellingAction = `+${string}`;

export type BoardAction = SpecialtyAction | SpellingAction;

export interface BoardGrid {
  rows: number;
  columns: number;
  order?: (string | null)[][];
}

export interface BoardLicense {
  type: string;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  sourceUrl?: string;
  copyrightNoticeUrl?: string;
}

export interface LoadBoard {
  id?: string;
  name?: string;
  url?: string;
  path?: string;
  dataUrl?: string;
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

export type BoardStrings = Record<string, Record<string, string>>;

export interface Board {
  id: string;
  name?: string;
  locale?: string;
  grid: BoardGrid;
  buttons: BoardButton[];
  descriptionHTML?: string;
  license?: BoardLicense;
  strings?: BoardStrings;
}

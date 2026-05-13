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
  loadBoard?: BoardLink;
}

export interface BoardLicense {
  type: string;
  authorName?: string;
  authorEmail?: string;
  authorUrl?: string;
  sourceUrl?: string;
  copyrightNoticeUrl?: string;
}

export type BoardStrings = Record<string, Record<string, string>>;

export interface BoardLink {
  id?: string;
  name?: string;
  url?: string;
  path?: string;
  dataUrl?: string;
}

export type BoardAction = SpecialtyAction | SpellingAction;

type SpecialtyAction = ":space" | ":clear" | ":home" | ":speak" | ":backspace";

type SpellingAction = `+${string}`;

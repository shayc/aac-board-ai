export interface Grid {
  rows: number;
  columns: number;
  order?: (string | null)[][];
}

export interface LoadBoard {
  id?: string;
  name?: string;
  url?: string;
  dataUrl?: string;
  path?: string;
}

type SpecialtyAction = ":space" | ":clear" | ":home" | ":speak" | ":backspace";
type SpellingAction = `+${string}`;

export type Action = SpecialtyAction | SpellingAction;

export interface Button {
  id: string;
  label?: string;
  vocalization?: string;
  backgroundColor?: string;
  borderColor?: string;
  imageSrc?: string;
  soundSrc?: string;
  actions?: Action[];
  loadBoard?: LoadBoard;
}

export interface Board {
  id: string;
  name?: string;
  buttons: Button[];
  grid: Grid;
}

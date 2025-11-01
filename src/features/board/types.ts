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

export type BoardAction = SpecialtyAction | SpellingAction;

export interface BoardButton {
  id: string;
  label?: string;
  vocalization?: string;
  backgroundColor?: string;
  borderColor?: string;
  imageSrc?: string;
  soundSrc?: string;
  actions?: BoardAction[];
  loadBoard?: LoadBoard;
}

export interface Board {
  id: string;
  name?: string;
  buttons: BoardButton[];
  grid: Grid;
}

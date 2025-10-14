export interface BoardGrid {
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

export interface BoardButton {
  id: string;
  label?: string;
  vocalization?: string;
  backgroundColor?: string;
  borderColor?: string;
  imageSrc?: string;
  soundSrc?: string;
  actions?: string[];
  loadBoard?: LoadBoard;
}

export interface Board {
  id: string;
  name?: string;
  buttons: BoardButton[];
  grid: BoardGrid;
}

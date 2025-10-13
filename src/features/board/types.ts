export interface Grid {
  rows: number;
  columns: number;
  order?: (string | null)[][];
}

export interface BoardImage {
  id: string;
  data?: string;
  url?: string;
  contentType?: string;
}

export interface BoardSound {
  id: string;
  data?: string;
  url?: string;
  contentType?: string;
}

export interface LoadBoard {
  id?: string;
  name: string;
  url?: string;
  dataUrl?: string;
  path?: string;
}

export interface BoardButton {
  id: string;
  label: string;
  vocalization?: string;
  backgroundColor?: string;
  borderColor?: string;
  imageId?: string;
  soundId?: string;
  action?: string;
  actions?: string[];
  loadBoard?: LoadBoard;
}

export interface Board {
  id: string;
  name: string;
  buttons: BoardButton[];
  grid: Grid;
  images?: BoardImage[];
  sounds?: BoardSound[];
}

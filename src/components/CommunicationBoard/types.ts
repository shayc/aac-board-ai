export interface Grid {
  rows: number;
  columns: number;
  order?: (string | null)[][];
}

export interface BoardButton {
  id: string;
  label: string;
  vocalization?: string;
  backgroundColor?: string;
  borderColor?: string;
  action?: string;
  actions?: string[];
}

export interface Board {
  id: string;
  name: string;
  buttons: BoardButton[];
  grid: Grid;
}

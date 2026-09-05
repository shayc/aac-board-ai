import type { MediaSource } from "@shared/media/media-source";

export interface Board {
  id: string;
  name?: string;
  sourceLocale?: string;
  grid: BoardGrid;
  buttons: BoardButton[];
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
  image?: MediaSource;
  sound?: MediaSource;
  backgroundColor?: string;
  borderColor?: string;
  behavior: ButtonBehavior;
}

export type ButtonBehavior =
  | { kind: "compose" }
  | { kind: "navigate"; boardId: string }
  | { kind: "actions"; actions: readonly BoardAction[] };

export type BoardAction =
  | { kind: "space" }
  | { kind: "backspace" }
  | { kind: "clear" }
  | { kind: "home" }
  | { kind: "playMessage" }
  | { kind: "spell"; text: string };

export type BoardStrings = Record<string, Record<string, string>>;

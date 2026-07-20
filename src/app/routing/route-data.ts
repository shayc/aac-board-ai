import type { BoardSummary } from "@features/board";

export interface BoardSetRouteData {
  language: string;
  boards: BoardSummary[];
}

import camelcaseKeys from "camelcase-keys";
import lotsOfStuff from "../../../open-board-format/examples/lots_of_stuff.json";
import type { Board } from "../types";

export function useCommunicationBoard() {
  const board = lotsOfStuff as unknown as Board;
  const camelCasedBoard = camelcaseKeys(board, { deep: true });
  return camelCasedBoard;
}

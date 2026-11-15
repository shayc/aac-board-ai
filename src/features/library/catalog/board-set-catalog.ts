import { deriveBoardSetIdFromURL } from "../import/import-from-url";
import type { BoardSetDownloadPhase } from "./board-set-downloads";

export interface CatalogBoardSet {
  readonly id: string;
  readonly name: string;
  readonly url: string;
}

function catalogBoardSet({
  name,
  fileName,
}: {
  name: string;
  fileName: string;
}): CatalogBoardSet {
  const url = `${import.meta.env.BASE_URL}${fileName}`;

  return { id: deriveBoardSetIdFromURL(url), name, url };
}

export const starterBoardSet = catalogBoardSet({
  name: "First Words",
  fileName: "first-words.obz",
});

const boardSetCatalog: readonly CatalogBoardSet[] = [
  starterBoardSet,
  catalogBoardSet({ name: "Quick Core 24", fileName: "quick-core-24.obz" }),
  catalogBoardSet({ name: "Quick Core 60", fileName: "quick-core-60.obz" }),
];

// A set stays downloadable until its download settles, even once its import is
// stored, so the download control hands over to the stored entry in one step.
export function listDownloadableBoardSets(
  storedBoardSets: readonly { id: string }[],
  downloadPhases: ReadonlyMap<string, BoardSetDownloadPhase>,
): CatalogBoardSet[] {
  const storedIds = new Set(storedBoardSets.map((boardSet) => boardSet.id));

  return boardSetCatalog.filter(
    (boardSet) =>
      !storedIds.has(boardSet.id) || downloadPhases.has(boardSet.url),
  );
}

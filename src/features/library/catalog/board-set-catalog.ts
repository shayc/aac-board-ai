import { deriveBoardSetIdFromURL } from "../import/import-from-url";

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

interface LibraryBoardSets<StoredBoardSet> {
  openableBoardSets: StoredBoardSet[];
  downloadableBoardSets: CatalogBoardSet[];
}

// A set stays downloadable until its download settles, even once its import is
// stored, so the download control hands over to the stored entry in one step.
export function splitLibraryBoardSets<StoredBoardSet extends { id: string }>(
  storedBoardSets: readonly StoredBoardSet[],
  downloadingURLs: ReadonlySet<string>,
): LibraryBoardSets<StoredBoardSet> {
  const storedIds = new Set(storedBoardSets.map((boardSet) => boardSet.id));
  const downloadableBoardSets = boardSetCatalog.filter(
    (boardSet) =>
      !storedIds.has(boardSet.id) || downloadingURLs.has(boardSet.url),
  );
  const downloadableIds = new Set(
    downloadableBoardSets.map((boardSet) => boardSet.id),
  );
  const openableBoardSets = storedBoardSets.filter(
    (boardSet) => !downloadableIds.has(boardSet.id),
  );

  return { openableBoardSets, downloadableBoardSets };
}

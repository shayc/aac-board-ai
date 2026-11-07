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
  catalogBoardSet({
    name: "Project Core-36 Universal Universal Core© 2017 by the CLDS",
    fileName: "project-core.obf",
  }),
];

export function listDownloadableBoardSets(
  storedBoardSets: readonly { id: string }[],
): CatalogBoardSet[] {
  const storedIds = new Set(storedBoardSets.map((boardSet) => boardSet.id));

  return boardSetCatalog.filter((boardSet) => !storedIds.has(boardSet.id));
}

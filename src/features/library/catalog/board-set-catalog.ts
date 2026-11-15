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

export const boardSetCatalog: readonly CatalogBoardSet[] = [
  starterBoardSet,
  catalogBoardSet({ name: "Quick Core 24", fileName: "quick-core-24.obz" }),
  catalogBoardSet({ name: "Quick Core 60", fileName: "quick-core-60.obz" }),
];

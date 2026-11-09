import { m } from "@paraglide/messages.js";
import type { Translate } from "@shared/language/use-translate";
import { deriveBoardSetIdFromURL } from "../import/import-from-url";

export interface CatalogBoardSet {
  readonly id: string;
  readonly name: string;
  readonly url: string;
}

interface CatalogEntry {
  readonly id: string;
  readonly url: string;
  readonly name: (t: Translate) => string;
}

function catalogEntry({
  name,
  fileName,
}: {
  name: (t: Translate) => string;
  fileName: string;
}): CatalogEntry {
  const url = `${import.meta.env.BASE_URL}${fileName}`;

  return { id: deriveBoardSetIdFromURL(url), name, url };
}

export const starterBoardSet = catalogEntry({
  name: (t) => t(m.boardSetCatalogFirstWords),
  fileName: "first-words.obz",
});

const boardSetCatalog: readonly CatalogEntry[] = [
  starterBoardSet,
  catalogEntry({
    name: (t) => t(m.boardSetCatalogQuickCore24),
    fileName: "quick-core-24.obz",
  }),
  catalogEntry({
    name: (t) => t(m.boardSetCatalogQuickCore60),
    fileName: "quick-core-60.obz",
  }),
];

export function listDownloadableBoardSets(
  storedBoardSets: readonly { id: string }[],
  t: Translate,
): CatalogBoardSet[] {
  const storedIds = new Set(storedBoardSets.map((boardSet) => boardSet.id));

  return boardSetCatalog
    .filter((boardSet) => !storedIds.has(boardSet.id))
    .map(({ id, name, url }) => ({ id, name: name(t), url }));
}

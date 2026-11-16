import { normalizeLocale } from "@shared/language/locale";
import { htmlToText } from "@shared/utils/html-to-text";
import type { OBFBoard } from "@shayc/open-board-format";
import { nonBlankText } from "../non-blank-text";

/** What a board set's root board says about the set. */
export interface BoardSetMetadata {
  readonly name: string;
  readonly author?: string;
  readonly description?: string;
  readonly license?: string;
  readonly locale?: string;
  readonly gridRows?: number;
  readonly gridColumns?: number;
}

/** A board set is described by its root board; `fallbackName` names a set whose root board has no name. */
export function obfToBoardSetMetadata(
  rootBoard: OBFBoard,
  fallbackName: string,
): BoardSetMetadata {
  return {
    name: nonBlankText(rootBoard.name) ?? fallbackName,
    author: rootBoard.license?.author_name,
    description: rootBoard.description_html
      ? htmlToText(rootBoard.description_html)
      : undefined,
    license: rootBoard.license?.type,
    locale: rootBoard.locale ? normalizeLocale(rootBoard.locale) : undefined,
    gridRows: rootBoard.grid.rows,
    gridColumns: rootBoard.grid.columns,
  };
}

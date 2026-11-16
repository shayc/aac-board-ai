import type { OBFBoard } from "@shayc/open-board-format";
import type { StringTranslations } from "../board-types";

/** Adds one language's board strings, keeping the languages the board already has. */
export function withOBFStrings(
  obfBoard: OBFBoard,
  language: string,
  translations: StringTranslations,
): OBFBoard {
  return {
    ...obfBoard,
    strings: {
      ...obfBoard.strings,
      [language]: Object.fromEntries(translations),
    },
  };
}

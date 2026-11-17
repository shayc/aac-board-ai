import type { OBFBoard } from "@shayc/open-board-format";
import type { StringTranslations } from "../board-types";

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

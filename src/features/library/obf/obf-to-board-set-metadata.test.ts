import { describe, expect, test } from "vitest";
import { makeOBFBoard } from "../testing";
import { obfToBoardSetMetadata } from "./obf-to-board-set-metadata";

describe("obfToBoardSetMetadata", () => {
  test("describes the board set from its root board without changing it", () => {
    const rootBoard = makeOBFBoard({
      name: "Core words",
      locale: "pt_br",
      description_html: "<p>A <strong>communication</strong> board</p>",
      license: { type: "CC-BY", author_name: "Author" },
      grid: {
        rows: 2,
        columns: 3,
        order: [
          [null, null, null],
          [null, null, null],
        ],
      },
    });
    const source = structuredClone(rootBoard);

    expect(obfToBoardSetMetadata(rootBoard, "fallback")).toEqual({
      name: "Core words",
      author: "Author",
      description: "A communication board",
      license: "CC-BY",
      locale: "pt-BR",
      gridRows: 2,
      gridColumns: 3,
    });
    expect(rootBoard).toEqual(source);
  });

  test.each([undefined, "", "  "])(
    "names the set by the fallback when the root board's name is %j",
    (name) => {
      const rootBoard = makeOBFBoard({ name, locale: undefined });

      expect(obfToBoardSetMetadata(rootBoard, "my-file")).toEqual({
        name: "my-file",
        author: undefined,
        description: undefined,
        license: undefined,
        locale: undefined,
        gridRows: 1,
        gridColumns: 1,
      });
    },
  );
});

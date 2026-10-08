import type { OBFBoard } from "@shayc/open-board-format";
import { describe, expect, test } from "vitest";
import { makeOBFBoard } from "../testing";
import { obfToBoard } from "./obf-to-board";

describe("obfToBoard", () => {
  test("maps a minimal board and defaults omitted optional fields", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "minimal-board",
      buttons: [{ id: "btn-1", label: "Hello" }],
      grid: {
        rows: 1,
        columns: 1,
        order: [["btn-1"]],
      },
    };

    const board = obfToBoard(obfBoard);

    expect(board.id).toBe("minimal-board");
    expect(board.name).toBeUndefined();
    expect(board.buttons).toHaveLength(1);
    expect(board.buttons[0]?.id).toBe("btn-1");
    expect(board.buttons[0]?.actions).toEqual([]);
    expect(board.grid.rows).toBe(1);
    expect(board.grid.columns).toBe(1);
    expect(board.grid.order).toEqual([["btn-1"]]);
  });

  describe("board fields", () => {
    test.each([
      { description: "missing", name: undefined },
      { description: "empty", name: "" },
      { description: "whitespace-only", name: " \t\n\u00a0 " },
    ])("normalizes $description board names to undefined", ({ name }) => {
      const board = obfToBoard(makeOBFBoard({ name }));

      expect(board.name).toBeUndefined();
    });

    test("preserves nonblank board names verbatim", () => {
      const name = "\tCore words \n";
      const board = obfToBoard(makeOBFBoard({ name }));

      expect(board.name).toBe(name);
    });

    test("maps the optional locale", () => {
      const obfBoard = makeOBFBoard({ locale: "en-US" });

      const board = obfToBoard(obfBoard);

      expect(board.locale).toBe("en-US");
    });

    test("normalizes the locale to BCP-47 casing on import", () => {
      const obfBoard = makeOBFBoard({ locale: "en_us" });

      const board = obfToBoard(obfBoard);

      expect(board.locale).toBe("en-US");
    });
  });

  describe("grid", () => {
    test("keeps grid shape and preserves null slots", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          { id: "btn-1", label: "A" },
          { id: "btn-2", label: "B" },
        ],
        grid: {
          rows: 2,
          columns: 2,
          order: [
            ["btn-1", null],
            [null, "btn-2"],
          ],
        },
      });

      const board = obfToBoard(obfBoard);

      expect(board.grid).toEqual({
        rows: 2,
        columns: 2,
        order: [
          ["btn-1", null],
          [null, "btn-2"],
        ],
      });
    });
  });

  describe("buttons", () => {
    test.each([
      { description: "missing", text: undefined },
      { description: "empty", text: "" },
      { description: "whitespace-only", text: " \t\n\u00a0 " },
    ])("normalizes $description button text to undefined", ({ text }) => {
      const obfBoard = makeOBFBoard({
        buttons: [{ id: "btn-1", label: text, vocalization: text }],
        grid: { rows: 1, columns: 1, order: [["btn-1"]] },
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0].label).toBeUndefined();
      expect(board.buttons[0].vocalization).toBeUndefined();
    });

    test("preserves nonblank button text verbatim", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          { id: "btn-1", label: " Hi ", vocalization: "\tHello there\n" },
        ],
        grid: { rows: 1, columns: 1, order: [["btn-1"]] },
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0].label).toBe(" Hi ");
      expect(board.buttons[0].vocalization).toBe("\tHello there\n");
    });

    test("maps button visual fields + vocalization", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "Hi",
            vocalization: "Hello there",
            background_color: "rgb(1, 2, 3)",
            border_color: "rgba(4, 5, 6, 0.5)",
          },
        ],
        grid: {
          rows: 1,
          columns: 1,
          order: [["btn-1"]],
        },
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0]).toMatchObject({
        id: "btn-1",
        label: "Hi",
        vocalization: "Hello there",
        backgroundColor: "rgb(1, 2, 3)",
        borderColor: "rgba(4, 5, 6, 0.5)",
      });
    });

    test("drops a CSS-unsafe button color", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "hi",
            background_color:
              "x); } a { background-image: url(https://evil.example) }",
            border_color: "rgb(0, 0, 0)",
          },
        ],
        grid: {
          rows: 1,
          columns: 1,
          order: [["btn-1"]],
        },
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0]?.backgroundColor).toBeUndefined();
      expect(board.buttons[0]?.borderColor).toBe("rgb(0, 0, 0)");
    });

    test("maps a load_board id to the runtime navigation target", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "Go",
            load_board: {
              id: "child-1",
              name: "Child",
              url: "https://example.com/child.obf",
              data_url: "https://example.com/child.obf?download=1",
              path: "boards/child.obf",
            },
          },
        ],
        grid: {
          rows: 1,
          columns: 1,
          order: [["btn-1"]],
        },
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0]?.loadBoard).toEqual({
        id: "child-1",
      });
    });

    test("ignores a load_board without a resolved id", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "Go",
            load_board: { path: "boards/child.obf" },
          },
        ],
        grid: { rows: 1, columns: 1, order: [["btn-1"]] },
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0]?.loadBoard).toBeUndefined();
    });

    test("uses actions and ignores the action fallback when both are present", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "Speak",
            action: ":speak",
            actions: [":space", ":clear"],
          },
        ],
        grid: {
          rows: 1,
          columns: 1,
          order: [["btn-1"]],
        },
      });

      const board = obfToBoard(obfBoard);
      expect(board.buttons[0]?.actions).toEqual([
        { kind: "space" },
        { kind: "clear" },
      ]);
    });

    test("treats an explicit empty actions array as no actions, ignoring action", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          { id: "btn-1", label: "Speak", action: ":speak", actions: [] },
        ],
        grid: { rows: 1, columns: 1, order: [["btn-1"]] },
      });

      const board = obfToBoard(obfBoard);
      expect(board.buttons[0]?.actions).toEqual([]);
    });

    test("falls back to the single action when actions is absent", () => {
      const obfBoard = makeOBFBoard({
        buttons: [{ id: "btn-1", label: "Speak", action: ":speak" }],
        grid: { rows: 1, columns: 1, order: [["btn-1"]] },
      });

      const board = obfToBoard(obfBoard);
      expect(board.buttons[0]?.actions).toEqual([{ kind: "speak" }]);
    });

    test("parses spell actions and drops unknown ones", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "Spell",
            actions: ["+ing", ":unknown", ":home"],
          },
        ],
        grid: { rows: 1, columns: 1, order: [["btn-1"]] },
      });

      const board = obfToBoard(obfBoard);
      expect(board.buttons[0]?.actions).toEqual([
        { kind: "spell", text: "ing" },
        { kind: "home" },
      ]);
    });
  });

  describe("media resolution", () => {
    test("chooses imageSrc/soundSrc by data > path > url precedence", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "Hello",
            image_id: "img-1",
            sound_id: "snd-1",
          },
        ],
        grid: {
          rows: 1,
          columns: 1,
          order: [["btn-1"]],
        },
        images: [
          {
            id: "img-1",
            data: "data:image/png;base64,AAA",
            path: "images/img-1.png",
            url: "https://example.com/img-1.png",
          },
        ],
        sounds: [
          {
            id: "snd-1",
            path: "sounds/snd-1.mp3",
            url: "https://example.com/snd-1.mp3",
          },
        ],
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0]?.imageSrc).toBe("data:image/png;base64,AAA");
      expect(board.buttons[0]?.soundSrc).toBe("sounds/snd-1.mp3");
    });

    test("falls back to url when no data/path is available", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "Media",
            image_id: "img-1",
            sound_id: "snd-1",
          },
        ],
        grid: {
          rows: 1,
          columns: 1,
          order: [["btn-1"]],
        },
        images: [
          {
            id: "img-1",
            url: "https://example.com/img.png",
          },
        ],
        sounds: [
          {
            id: "snd-1",
            url: "https://example.com/snd.mp3",
          },
        ],
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0]?.imageSrc).toBe("https://example.com/img.png");
      expect(board.buttons[0]?.soundSrc).toBe("https://example.com/snd.mp3");
    });

    test("returns undefined imageSrc/soundSrc for unknown ids", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "Missing",
            image_id: "img-does-not-exist",
            sound_id: "snd-does-not-exist",
          },
        ],
        grid: {
          rows: 1,
          columns: 1,
          order: [["btn-1"]],
        },
        images: [{ id: "img-1", data: "data:image/png;base64,AAA" }],
        sounds: [{ id: "snd-1", data: "data:audio/mp3;base64,BBB" }],
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0]?.imageSrc).toBeUndefined();
      expect(board.buttons[0]?.soundSrc).toBeUndefined();
    });

    test("handles missing images and sounds arrays gracefully", () => {
      const obfBoard: OBFBoard = {
        format: "open-board-0.1",
        id: "board-no-media-arrays",
        buttons: [
          {
            id: "btn-1",
            label: "Button",
            image_id: "img-1",
            sound_id: "snd-1",
          },
        ],
        grid: {
          rows: 1,
          columns: 1,
          order: [["btn-1"]],
        },
      };

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0]?.imageSrc).toBeUndefined();
      expect(board.buttons[0]?.soundSrc).toBeUndefined();
    });

    test("ignores media entries without any source (no data, path, or url)", () => {
      const obfBoard = makeOBFBoard({
        buttons: [
          {
            id: "btn-1",
            label: "Button",
            image_id: "img-empty",
            sound_id: "snd-empty",
          },
        ],
        grid: {
          rows: 1,
          columns: 1,
          order: [["btn-1"]],
        },
        images: [
          {
            id: "img-empty",
          },
        ],
        sounds: [
          {
            id: "snd-empty",
          },
        ],
      });

      const board = obfToBoard(obfBoard);

      expect(board.buttons[0]?.imageSrc).toBeUndefined();
      expect(board.buttons[0]?.soundSrc).toBeUndefined();
    });
  });
});

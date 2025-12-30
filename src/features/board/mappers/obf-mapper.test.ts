import { describe, expect, test } from "vitest";
import type { OBFBoard } from "@shared/open-board-format/schema";
import { obfToBoard } from "./obf-mapper";

describe("obfToBoard", () => {
  test("prefers media sources in data > path > url order", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-1",
      name: "Test Board",
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
    };

    const board = obfToBoard(obfBoard);

    expect(board.buttons[0]?.imageSrc).toBe("data:image/png;base64,AAA");
    expect(board.buttons[0]?.soundSrc).toBe("sounds/snd-1.mp3");
  });

  test("obfToBoard merges action + actions in order", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-2",
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
    };

    const board = obfToBoard(obfBoard);
    expect(board.buttons[0]?.actions).toEqual([":speak", ":space", ":clear"]);
  });

  test("obfToBoard maps button visual fields + vocalization", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-visuals",
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
    };

    const board = obfToBoard(obfBoard);

    expect(board.buttons[0]).toMatchObject({
      id: "btn-1",
      label: "Hi",
      vocalization: "Hello there",
      backgroundColor: "rgb(1, 2, 3)",
      borderColor: "rgba(4, 5, 6, 0.5)",
    });
  });

  test("obfToBoard maps load_board to camelCased LoadBoard", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-load",
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
    };

    const board = obfToBoard(obfBoard);

    expect(board.buttons[0]?.loadBoard).toEqual({
      id: "child-1",
      name: "Child",
      url: "https://example.com/child.obf",
      dataUrl: "https://example.com/child.obf?download=1",
      path: "boards/child.obf",
    });
  });

  test("obfToBoard keeps grid shape and preserves null slots", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-grid",
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
    };

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

  test("obfToBoard returns undefined imageSrc/soundSrc for unknown ids", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-missing-media",
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
    };

    const board = obfToBoard(obfBoard);

    expect(board.buttons[0]?.imageSrc).toBeUndefined();
    expect(board.buttons[0]?.soundSrc).toBeUndefined();
  });

  test("obfToBoard prefers path over url when data is absent", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-path-fallback",
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
          path: "images/img-1.png",
          url: "https://example.com/img.png",
        },
      ],
      sounds: [
        {
          id: "snd-1",
          path: "sounds/snd-1.mp3",
          url: "https://example.com/snd.mp3",
        },
      ],
    };

    const board = obfToBoard(obfBoard);

    expect(board.buttons[0]?.imageSrc).toBe("images/img-1.png");
    expect(board.buttons[0]?.soundSrc).toBe("sounds/snd-1.mp3");
  });

  test("obfToBoard falls back to url when no data/path is available", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-url-fallback",
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
    };

    const board = obfToBoard(obfBoard);

    expect(board.buttons[0]?.imageSrc).toBe("https://example.com/img.png");
    expect(board.buttons[0]?.soundSrc).toBe("https://example.com/snd.mp3");
  });

  test("obfToBoard sets actions to an empty array when none are provided", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-actions-empty",
      buttons: [{ id: "btn-1", label: "No actions" }],
      grid: {
        rows: 1,
        columns: 1,
        order: [["btn-1"]],
      },
    };

    const board = obfToBoard(obfBoard);
    expect(board.buttons[0]?.actions).toEqual([]);
  });

  test("obfToBoard maps license fields with snake_case to camelCase", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-license",
      buttons: [],
      grid: {
        rows: 1,
        columns: 1,
        order: [[null]],
      },
      license: {
        type: "CC BY-SA 4.0",
        copyright_notice_url: "https://example.com/copyright",
        source_url: "https://example.com/source",
        author_name: "Jane Doe",
        author_url: "https://example.com/author",
        author_email: "jane@example.com",
      },
    };

    const board = obfToBoard(obfBoard);

    expect(board.license).toEqual({
      type: "CC BY-SA 4.0",
      copyrightNoticeUrl: "https://example.com/copyright",
      sourceUrl: "https://example.com/source",
      authorName: "Jane Doe",
      authorUrl: "https://example.com/author",
      authorEmail: "jane@example.com",
    });
  });

  test("obfToBoard maps top-level locale and descriptionHTML fields", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-top-level",
      name: "My Board",
      locale: "en-US",
      description_html: "<p>Board description</p>",
      buttons: [],
      grid: {
        rows: 1,
        columns: 1,
        order: [[null]],
      },
    };

    const board = obfToBoard(obfBoard);

    expect(board.id).toBe("board-top-level");
    expect(board.name).toBe("My Board");
    expect(board.locale).toBe("en-US");
    expect(board.descriptionHTML).toBe("<p>Board description</p>");
  });

  test("obfToBoard handles missing images and sounds arrays gracefully", () => {
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
      // No images or sounds arrays defined
    };

    const board = obfToBoard(obfBoard);

    expect(board.buttons[0]?.imageSrc).toBeUndefined();
    expect(board.buttons[0]?.soundSrc).toBeUndefined();
  });

  test("obfToBoard ignores media entries without any source (no data, path, or url)", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-empty-media",
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
          // No data, path, or url provided
        },
      ],
      sounds: [
        {
          id: "snd-empty",
          // No data, path, or url provided
        },
      ],
    };

    const board = obfToBoard(obfBoard);

    expect(board.buttons[0]?.imageSrc).toBeUndefined();
    expect(board.buttons[0]?.soundSrc).toBeUndefined();
  });

  test("obfToBoard handles board without optional name field", () => {
    const obfBoard: OBFBoard = {
      format: "open-board-0.1",
      id: "board-no-name",
      // name is optional and omitted
      buttons: [],
      grid: {
        rows: 1,
        columns: 1,
        order: [[null]],
      },
    };

    const board = obfToBoard(obfBoard);

    expect(board.id).toBe("board-no-name");
    expect(board.name).toBeUndefined();
  });
});

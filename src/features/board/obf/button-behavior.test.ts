import { describe, expect, test } from "vitest";
import { makeOBFBoard } from "../testing";
import { obfToBoard } from "./obf-to-board";

describe("normalized button behavior", () => {
  test("navigation takes precedence over actions and playable content", () => {
    const board = obfToBoard(
      makeOBFBoard({
        buttons: [
          {
            id: "link",
            label: "Go",
            load_board: { id: "child" },
            actions: [":space"],
            sound_id: "audio",
          },
        ],
        sounds: [{ id: "audio", url: "beep.mp3" }],
      }),
    );

    expect(board.buttons[0].behavior).toEqual({
      kind: "navigate",
      boardId: "child",
    });
  });

  test("actions take precedence over playable content and preserve order", () => {
    const board = obfToBoard(
      makeOBFBoard({
        buttons: [
          { id: "actions", label: "Action", actions: [":space", ":home"] },
        ],
      }),
    );

    expect(board.buttons[0].behavior).toEqual({
      kind: "actions",
      actions: [{ kind: "space" }, { kind: "home" }],
    });
  });

  test("composition preserves both the visible label and vocalization", () => {
    const board = obfToBoard(
      makeOBFBoard({
        buttons: [
          {
            id: "apple",
            label: "Apple",
            vocalization: "Eat apple",
            sound_id: "audio",
          },
        ],
        sounds: [{ id: "audio", url: "apple.mp3" }],
      }),
    );

    expect(board.buttons[0]).toMatchObject({
      behavior: { kind: "compose" },
      label: "Apple",
      vocalization: "Eat apple",
      sound: "apple.mp3",
    });
  });

  test("an inaudible button still has an explicit composition behavior", () => {
    const board = obfToBoard(makeOBFBoard({ buttons: [{ id: "silent" }] }));

    expect(board.buttons[0].behavior).toEqual({ kind: "compose" });
  });
});

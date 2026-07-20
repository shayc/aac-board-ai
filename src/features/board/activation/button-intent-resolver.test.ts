import { describe, expect, test } from "vitest";
import { resolveButtonIntents } from "./button-intent-resolver";
import type { BoardButton } from "../types";

describe("resolveButtonIntents", () => {
  test("returns navigate intent if loadBoard is present with id", () => {
    const button: BoardButton = {
      id: "b1",
      loadBoard: { id: "board2" },
      actions: [{ kind: "space" }],
      soundSrc: "beep.mp3",
    };
    const intents = resolveButtonIntents(button);
    expect(intents).toEqual([{ kind: "navigate", targetBoardId: "board2" }]);
  });

  test("returns runAction intents if actions array is present", () => {
    const button: BoardButton = {
      id: "b1",
      actions: [{ kind: "space" }, { kind: "home" }],
      soundSrc: "beep.mp3",
    };
    const intents = resolveButtonIntents(button);
    expect(intents).toEqual([
      { kind: "runAction", action: { kind: "space" } },
      { kind: "runAction", action: { kind: "home" } },
    ]);
  });

  test("returns one high-level compose-and-play intent", () => {
    const button: BoardButton = {
      id: "b1",
      label: "apple",
      soundSrc: "apple.mp3",
    };
    const intents = resolveButtonIntents(button);
    expect(intents).toEqual([
      {
        kind: "composeAndPlay",
        content: {
          label: "apple",
          vocalization: undefined,
          imageSrc: undefined,
          soundSrc: "apple.mp3",
        },
      },
    ]);
  });

  test("keeps vocalization in the high-level playable content", () => {
    const button: BoardButton = {
      id: "b1",
      label: "Apple",
      vocalization: "Eat apple",
    };
    const intents = resolveButtonIntents(button);
    expect(intents).toEqual([
      {
        kind: "composeAndPlay",
        content: {
          label: "Apple",
          vocalization: "Eat apple",
          imageSrc: undefined,
          soundSrc: undefined,
        },
      },
    ]);
  });

  test("still composes content that has nothing audible", () => {
    const button: BoardButton = {
      id: "b1",
    };
    const intents = resolveButtonIntents(button);
    expect(intents).toEqual([
      {
        kind: "composeAndPlay",
        content: {
          label: undefined,
          vocalization: undefined,
          imageSrc: undefined,
          soundSrc: undefined,
        },
      },
    ]);
  });
});

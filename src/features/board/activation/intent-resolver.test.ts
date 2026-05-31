import { describe, expect, test } from "vitest";
import { resolveButtonIntent } from "./intent-resolver";
import type { BoardButton } from "../types";

describe("resolveButtonIntent", () => {
  test("returns navigate intent if loadBoard is present with id", () => {
    const button: BoardButton = {
      id: "b1",
      loadBoard: { id: "board2" },
      actions: [{ kind: "space" }],
      soundSrc: "beep.mp3",
    };
    const intents = resolveButtonIntent(button);
    expect(intents).toEqual([{ kind: "navigate", targetBoardId: "board2" }]);
  });

  test("returns runAction intents if actions array is present", () => {
    const button: BoardButton = {
      id: "b1",
      actions: [{ kind: "space" }, { kind: "home" }],
      soundSrc: "beep.mp3",
    };
    const intents = resolveButtonIntent(button);
    expect(intents).toEqual([
      { kind: "runAction", action: { kind: "space" } },
      { kind: "runAction", action: { kind: "home" } },
    ]);
  });

  test("returns compose and playAudio intents if soundSrc is present", () => {
    const button: BoardButton = {
      id: "b1",
      label: "apple",
      soundSrc: "apple.mp3",
    };
    const intents = resolveButtonIntent(button);
    expect(intents).toEqual([
      {
        kind: "compose",
        content: {
          label: "apple",
          vocalization: undefined,
          imageSrc: undefined,
          soundSrc: "apple.mp3",
        },
      },
      { kind: "playAudio", src: "apple.mp3" },
    ]);
  });

  test("returns compose and speakText intents if vocalization or label is present without soundSrc", () => {
    const button: BoardButton = {
      id: "b1",
      label: "Apple",
      vocalization: "Eat apple",
    };
    const intents = resolveButtonIntent(button);
    expect(intents).toEqual([
      {
        kind: "compose",
        content: {
          label: "Apple",
          vocalization: "Eat apple",
          imageSrc: undefined,
          soundSrc: undefined,
        },
      },
      { kind: "speakText", text: "eat apple" },
    ]);
  });

  test("returns only compose intent if no sound or text is speakable", () => {
    const button: BoardButton = {
      id: "b1",
    };
    const intents = resolveButtonIntent(button);
    expect(intents).toEqual([
      {
        kind: "compose",
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

import { describe, expect, test } from "vitest";
import { makeOBFBoard } from "../testing";
import { collectMediaPaths } from "./collect-media-paths";

describe("collectMediaPaths", () => {
  test("collects each image and sound path once across boards", () => {
    const boards = [
      makeOBFBoard({
        id: "home",
        images: [{ id: "img-1", path: "images/cat.png" }],
        sounds: [{ id: "snd-1", path: "sounds/meow.mp3" }],
      }),
      makeOBFBoard({
        id: "pets",
        images: [
          { id: "img-1", path: "images/cat.png" },
          { id: "img-2", path: "images/dog.png" },
        ],
      }),
    ];

    expect([...collectMediaPaths(boards)]).toEqual([
      "images/cat.png",
      "sounds/meow.mp3",
      "images/dog.png",
    ]);
  });

  test("skips media without a path", () => {
    const board = makeOBFBoard({
      images: [
        { id: "img-1", url: "https://example.com/cat.png" },
        { id: "img-2", path: "" },
      ],
    });

    expect(collectMediaPaths([board]).size).toBe(0);
  });

  test("returns a path as the board spells it", () => {
    const board = makeOBFBoard({
      images: [{ id: "img-1", path: "/images//cat.png" }],
    });

    expect([...collectMediaPaths([board])]).toEqual(["/images//cat.png"]);
  });

  test("reads a board with no images or sounds", () => {
    const board = makeOBFBoard({ images: undefined, sounds: undefined });

    expect(collectMediaPaths([board]).size).toBe(0);
  });
});

import { describe, expect, test } from "vitest";
import { toPrediction } from "./to-prediction";

const BOARD_WORDS = ["eat", "drink", "more", "help", "stop"];

function predict(
  raw: string,
  overrides: Partial<Parameters<typeof toPrediction>[0]> = {},
) {
  return toPrediction({
    raw,
    boardWords: BOARD_WORDS,
    messageText: "I want",
    ...overrides,
  });
}

describe("toPrediction", () => {
  test("maps model words back to the board's canonical casing", () => {
    const words = predict('{"words":["eat"]}', {
      boardWords: ["EAT", "Drink"],
    });

    expect(words).toEqual(["EAT"]);
  });

  test("keeps consecutive board words", () => {
    expect(predict('{"words":["more","help"]}')).toEqual(["more", "help"]);
  });

  test("truncates at the first word that is not on the board", () => {
    expect(predict('{"words":["eat","pizza","more"]}')).toEqual(["eat"]);
  });

  test("rejects a prediction with no board words", () => {
    expect(predict('{"words":["to","the"]}')).toEqual([]);
  });

  test("drops a leading word that repeats the last typed word", () => {
    expect(
      predict('{"words":["want","more"]}', { messageText: "I want" }),
    ).toEqual(["more"]);
  });

  test("returns an empty list for malformed JSON", () => {
    expect(predict("not json at all")).toEqual([]);
  });

  test("returns an empty list when words is not an array of strings", () => {
    expect(predict('{"words":[1,2]}')).toEqual([]);
    expect(predict('{"words":"eat"}')).toEqual([]);
    expect(predict("{}")).toEqual([]);
  });

  test("strips surrounding punctuation and quotes before matching", () => {
    expect(predict('{"words":["\\"eat\\"","more!"]}')).toEqual(["eat", "more"]);
  });

  test("caps the prediction at three words", () => {
    expect(
      predict('{"words":["eat","more","help","stop"]}', {
        boardWords: ["eat", "more", "help", "stop"],
        messageText: "I want",
      }),
    ).toEqual(["eat", "more", "help"]);
  });
});

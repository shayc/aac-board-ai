import { describe, expect, test } from "vitest";
import { toPredictedWords } from "./to-predicted-words";

const BOARD_WORDS = ["eat", "drink", "more", "help", "stop"];

function predict(
  rawResponse: string,
  boardWords: readonly string[] = BOARD_WORDS,
) {
  return toPredictedWords({ rawResponse, boardWords });
}

describe("toPredictedWords", () => {
  test("maps model words back to the board's casing", () => {
    expect(predict('{"words":["eat"]}', ["EAT", "Drink"])).toEqual(["EAT"]);
  });

  test("keeps consecutive board words", () => {
    expect(predict('{"words":["more","help"]}')).toEqual(["more", "help"]);
  });

  test("skips words that are not on the board", () => {
    expect(predict('{"words":["eat","pizza","more"]}')).toEqual([
      "eat",
      "more",
    ]);
  });

  test("returns an empty list when no words are on the board", () => {
    expect(predict('{"words":["to","the"]}')).toEqual([]);
  });

  test("caps the prediction at three words", () => {
    expect(
      predict('{"words":["eat","more","help","stop"]}', [
        "eat",
        "more",
        "help",
        "stop",
      ]),
    ).toEqual(["eat", "more", "help"]);
  });
});

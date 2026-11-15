import { describe, expect, test } from "vitest";
import { messageTransitionName } from "./message-transition-name";

describe("messageTransitionName", () => {
  test("names a phrase and the message made from it alike", () => {
    expect(messageTransitionName("  I want   water. ")).toBe(
      messageTransitionName("I want water."),
    );
  });

  test("names different messages differently", () => {
    expect(messageTransitionName("I want water.")).not.toBe(
      messageTransitionName("I want food."),
    );
  });

  test("builds a valid CSS identifier from any text", () => {
    expect(messageTransitionName("¿Quieres agua? 水")).toMatch(
      /^message-[0-9a-z]+$/,
    );
  });
});

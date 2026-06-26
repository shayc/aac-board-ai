import { describe, expect, test } from "vitest";
import { deriveToneControlState } from "./derive-tone-control-state";

describe("deriveToneControlState", () => {
  test.each(["unsupported", "unavailable", "error"] as const)(
    "hides the selector while %s",
    (status) => {
      expect(deriveToneControlState(status)).toBe("hidden");
    },
  );

  test.each(["downloadable", "downloading"] as const)(
    "disables the selector while %s",
    (status) => {
      expect(deriveToneControlState(status)).toBe("disabled");
    },
  );

  test("enables the selector once the rewriter is ready", () => {
    expect(deriveToneControlState("ready")).toBe("enabled");
  });

  test("keeps the selector enabled while idle so a re-tap survives re-provisioning", () => {
    expect(deriveToneControlState("idle")).toBe("enabled");
  });
});

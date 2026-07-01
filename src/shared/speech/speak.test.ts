import { beforeEach, describe, expect, test, vi } from "vitest";

describe("speak() without Web Speech API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("speechSynthesis", undefined);
  });

  test("speak() resolves silently instead of throwing", async () => {
    const { speak } = await import("./speak");
    await expect(speak("hello")).resolves.toBeUndefined();
  });
});

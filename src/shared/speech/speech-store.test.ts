import { beforeEach, describe, expect, test, vi } from "vitest";

describe("speech-store without Web Speech API", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("speechSynthesis", undefined);
  });

  test("speak() resolves silently instead of throwing", async () => {
    const { speak } = await import("./speech-store");
    await expect(speak("hello")).resolves.toBeUndefined();
  });
});

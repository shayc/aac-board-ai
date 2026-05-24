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

  test("stop() is a no-op instead of throwing", async () => {
    const { stop } = await import("./speech-store");
    expect(() => stop()).not.toThrow();
  });
});

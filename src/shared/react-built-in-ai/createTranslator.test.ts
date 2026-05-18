import { afterEach, describe, expect, test, vi } from "vitest";
import { createTranslator } from "./createTranslator.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createTranslator", () => {
  test("returns null when the Translator global is absent", async () => {
    vi.stubGlobal("Translator", undefined);
    await expect(
      createTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    ).resolves.toBeNull();
  });

  test("returns null when the model is unavailable", async () => {
    const create = vi.fn();
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("unavailable")),
      create,
    });

    await expect(
      createTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    ).resolves.toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  test("creates a translator when available", async () => {
    const instance = {
      translate: (input: string) => Promise.resolve(`T:${input}`),
      destroy: vi.fn(),
    };
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve(instance)),
    });

    const translator = await createTranslator({
      sourceLanguage: "en",
      targetLanguage: "fr",
    });

    expect(translator).not.toBeNull();
    await expect(translator?.translate("hi")).resolves.toBe("T:hi");
  });

  test("forwards the caller's AbortSignal to create()", async () => {
    const create = vi.fn(() => Promise.resolve({ destroy: vi.fn() }));
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const controller = new AbortController();
    await createTranslator({
      sourceLanguage: "en",
      targetLanguage: "fr",
      signal: controller.signal,
    });

    const [createArg] = create.mock.calls[0] as [{ signal?: AbortSignal }];
    expect(createArg.signal).toBe(controller.signal);
  });

  test("does not pass signal into availability()", async () => {
    const availability = vi.fn(() => Promise.resolve("available" as const));
    vi.stubGlobal("Translator", {
      availability,
      create: vi.fn(() => Promise.resolve({ destroy: vi.fn() })),
    });

    const controller = new AbortController();
    await createTranslator({
      sourceLanguage: "en",
      targetLanguage: "fr",
      signal: controller.signal,
    });

    const [arg] = availability.mock.calls[0] as [Record<string, unknown>];
    expect(arg).not.toHaveProperty("signal");
    expect(arg).toEqual({ sourceLanguage: "en", targetLanguage: "fr" });
  });
});

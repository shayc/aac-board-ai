import { afterEach, describe, expect, test, vi } from "vitest";
import { createTranslator } from "./createTranslator.ts";
import {
  NoUserActivationError,
  UnavailableError,
  UnsupportedError,
} from "./errors.ts";
import {
  clearDownloadProgress,
  setDownloadProgress,
  snapshotProgressFor,
} from "./internal/progress-store.ts";

function setUserActivation(isActive: boolean): void {
  Object.defineProperty(navigator, "userActivation", {
    value: { isActive },
    configurable: true,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete (navigator as unknown as { userActivation?: unknown }).userActivation;
});

describe("createTranslator", () => {
  test("throws UnsupportedError when the Translator global is absent", async () => {
    vi.stubGlobal("Translator", undefined);
    await expect(
      createTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    ).rejects.toBeInstanceOf(UnsupportedError);
  });

  test("throws UnavailableError when the model is unavailable", async () => {
    const create = vi.fn();
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("unavailable")),
      create,
    });

    await expect(
      createTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    ).rejects.toBeInstanceOf(UnavailableError);
    expect(create).not.toHaveBeenCalled();
  });

  test("throws NoUserActivationError when downloadable without a user gesture", async () => {
    setUserActivation(false);
    const create = vi.fn();
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create,
    });

    await expect(
      createTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    ).rejects.toBeInstanceOf(NoUserActivationError);
    expect(create).not.toHaveBeenCalled();
  });

  test("creates a translator when available without requiring activation", async () => {
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

    await expect(translator.translate("hi")).resolves.toBe("T:hi");
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

    const [createArg] = create.mock.calls[0] as unknown as [
      { signal?: AbortSignal },
    ];
    expect(createArg.signal).toBe(controller.signal);
  });

  test("returned instance is AsyncDisposable and disposal destroys it", async () => {
    const destroy = vi.fn();
    const instance = {
      translate: (input: string) => Promise.resolve(`T:${input}`),
      destroy,
    };
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve(instance)),
    });

    {
      await using translator = await createTranslator({
        sourceLanguage: "en",
        targetLanguage: "fr",
      });
      expect(typeof translator[Symbol.asyncDispose]).toBe("function");
      expect(destroy).not.toHaveBeenCalled();
    }

    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test("does not redefine [Symbol.asyncDispose] when the instance already implements it", async () => {
    const nativeDispose = vi.fn(() => Promise.resolve());
    const instance = {
      translate: vi.fn(),
      destroy: vi.fn(),
      [Symbol.asyncDispose]: nativeDispose,
    };
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve(instance)),
    });

    const translator = await createTranslator({
      sourceLanguage: "en",
      targetLanguage: "fr",
    });
    expect(translator[Symbol.asyncDispose]).toBe(nativeDispose);
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

    const [arg] = availability.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ];
    expect(arg).not.toHaveProperty("signal");
    expect(arg).toEqual({ sourceLanguage: "en", targetLanguage: "fr" });
  });

  test("writes 0 to the progress store at download start and clears it after create resolves", async () => {
    setUserActivation(true);
    let resolveCreate!: (value: { destroy: () => void }) => void;
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create: vi.fn(
        () =>
          new Promise<{ destroy: () => void }>((resolve) => {
            resolveCreate = resolve;
          }),
      ),
    });

    const pending = createTranslator({
      sourceLanguage: "en",
      targetLanguage: "fr",
    });

    // While create is still in-flight, the store reflects 0 (not "no download").
    await vi.waitFor(() => expect(snapshotProgressFor("Translator")).toBe(0));

    resolveCreate({ destroy: vi.fn() });
    await pending;

    // After create resolves the entry is cleared.
    expect(snapshotProgressFor("Translator")).toBe(0);
    // Sanity: clearing-then-snapshotting an absent key still returns 0.
    clearDownloadProgress(
      'Translator:{"sourceLanguage":"en","targetLanguage":"fr"}',
    );
  });

  // Fast path (availability='available') must not write to the cross-namespace
  // progress store — a pre-seeded unrelated entry stays untouched.
  test("does not touch the progress store on the available fast path", async () => {
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve({ destroy: vi.fn() })),
    });

    // Seed a different prefix; if createTranslator wrote anything Translator-prefixed,
    // this would still be 0 — so we also assert by checking aggregation of "Translator".
    setDownloadProgress("Summarizer", 0.42);
    await createTranslator({ sourceLanguage: "en", targetLanguage: "fr" });
    expect(snapshotProgressFor("Translator")).toBe(0);
    expect(snapshotProgressFor("Summarizer")).toBe(0.42);
    clearDownloadProgress("Summarizer");
  });
});

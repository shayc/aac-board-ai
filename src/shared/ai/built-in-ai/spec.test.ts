import { afterEach, describe, expect, test, vi } from "vitest";
import { availability, createSession } from "./spec";
import { makeTranslatorFake } from "./__fixtures__/translator-fake";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("spec", () => {
  test("unsupported when the global is absent", async () => {
    vi.stubGlobal("Translator", undefined);
    await expect(
      availability("Translator", {
        sourceLanguage: "en",
        targetLanguage: "fr",
      }),
    ).resolves.toBe("unsupported");
    await expect(
      createSession("Translator", {
        sourceLanguage: "en",
        targetLanguage: "fr",
      }),
    ).resolves.toBeNull();
  });

  test("passes through the spec availability when present", async () => {
    const { Fake } = makeTranslatorFake({ status: "downloadable" });
    vi.stubGlobal("Translator", Fake);

    await expect(
      availability("Translator", {
        sourceLanguage: "en",
        targetLanguage: "fr",
      }),
    ).resolves.toBe("downloadable");
  });

  test("creates a session and reports download progress", async () => {
    const { Fake } = makeTranslatorFake({
      status: "downloadable",
      withMonitor: true,
    });
    vi.stubGlobal("Translator", Fake);

    const seen: number[] = [];
    const session = await createSession("Translator", {
      sourceLanguage: "en",
      targetLanguage: "fr",
      onProgress: (fraction) => seen.push(fraction),
    });

    expect(session).not.toBeNull();
    expect(seen).toContain(0.5);
    await expect(session?.translate("hi")).resolves.toBe("T:hi");
  });

  test("returns null when the model is unavailable", async () => {
    const { Fake, create } = makeTranslatorFake({ status: "unavailable" });
    vi.stubGlobal("Translator", Fake);

    await expect(
      createSession("Translator", {
        sourceLanguage: "en",
        targetLanguage: "fr",
      }),
    ).resolves.toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  test("does not leak onProgress into namespace.availability or namespace.create", async () => {
    const availabilityMock = vi.fn<(options: unknown) => Promise<Availability>>(
      () => Promise.resolve("available"),
    );
    const createMock = vi.fn<
      (options: unknown) => Promise<{ destroy: () => void }>
    >(() => Promise.resolve({ destroy: vi.fn() }));
    vi.stubGlobal("Translator", {
      availability: availabilityMock,
      create: createMock,
    });

    await createSession("Translator", {
      sourceLanguage: "en",
      targetLanguage: "fr",
      onProgress: vi.fn(),
    });

    expect(availabilityMock.mock.calls[0]?.[0]).not.toHaveProperty(
      "onProgress",
    );
    expect(createMock.mock.calls[0]?.[0]).not.toHaveProperty("onProgress");
  });
});

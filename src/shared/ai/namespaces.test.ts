import { afterEach, describe, expect, test, vi } from "vitest";
import { availability, createSession } from "./namespaces";
import { makeTranslatorFake } from "./__fixtures__/translator-fake";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("namespaces", () => {
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

  test("creates a session from a downloadable namespace", async () => {
    const { Fake } = makeTranslatorFake({
      status: "downloadable",
      withMonitor: true,
    });
    vi.stubGlobal("Translator", Fake);

    const session = await createSession("Translator", {
      sourceLanguage: "en",
      targetLanguage: "fr",
      progressKey: "Translator:en:fr",
    });

    expect(session).not.toBeNull();
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

  test("does not leak progressKey into namespace.availability or namespace.create", async () => {
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
      progressKey: "Translator:en:fr",
    });

    expect(availabilityMock.mock.calls[0]?.[0]).not.toHaveProperty(
      "progressKey",
    );
    expect(createMock.mock.calls[0]?.[0]).not.toHaveProperty("progressKey");
  });
});

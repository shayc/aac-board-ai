import { afterEach, describe, expect, test, vi } from "vitest";
import { availability, createSession } from "./built-in-ai";

function progressEvent(loaded: number): Event {
  return Object.assign(new Event("downloadprogress"), { loaded });
}

function makeTranslatorFake({
  status = "available",
}: { status?: Availability } = {}) {
  const destroy = vi.fn();
  const create = vi.fn((options: { monitor?: (m: EventTarget) => void }) => {
    const monitor = new EventTarget();
    options.monitor?.(monitor);
    monitor.dispatchEvent(progressEvent(0.5));
    return Promise.resolve({
      translate: (input: string) => Promise.resolve(`T:${input}`),
      destroy,
    });
  });
  return {
    Fake: { availability: vi.fn(() => Promise.resolve(status)), create },
    create,
    destroy,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("built-in-ai", () => {
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
    const { Fake } = makeTranslatorFake({ status: "downloadable" });
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
    const availability = vi.fn<(options: unknown) => Promise<Availability>>(
      () => Promise.resolve("available"),
    );
    const create = vi.fn<
      (options: unknown) => Promise<{ destroy: () => void }>
    >(() => Promise.resolve({ destroy: vi.fn() }));
    vi.stubGlobal("Translator", { availability, create });

    await createSession("Translator", {
      sourceLanguage: "en",
      targetLanguage: "fr",
      onProgress: vi.fn(),
    });

    expect(availability.mock.calls[0]?.[0]).not.toHaveProperty("onProgress");
    expect(create.mock.calls[0]?.[0]).not.toHaveProperty("onProgress");
  });
});

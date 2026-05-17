import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useTranslator } from "./useBuiltInAI";

function makeTranslatorFake({
  failCreate = false,
  status = "available",
}: { failCreate?: boolean; status?: Availability } = {}) {
  const destroy = vi.fn();
  const create = vi.fn(() =>
    failCreate
      ? Promise.reject(new Error("create failed"))
      : Promise.resolve({
          translate: (input: string) => Promise.resolve(`T:${input}`),
          translateStreaming: () => new ReadableStream<string>(),
          destroy,
        }),
  );
  return {
    Fake: { availability: vi.fn(() => Promise.resolve(status)), create },
    create,
    destroy,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useTranslator", () => {
  test("reaches ready and exposes a session", async () => {
    const { Fake } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    await expect(result.current.session?.translate("hi")).resolves.toBe("T:hi");
  });

  test("destroys the session on unmount", async () => {
    const { Fake, destroy } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    const { result, unmount } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    await unmount();
    await vi.waitFor(() => expect(destroy).toHaveBeenCalledTimes(1));
  });

  test("re-creates when the identity changes", async () => {
    const { Fake, create } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    const { result, rerender } = await renderHook(
      (props: { target: string } = { target: "fr" }) =>
        useTranslator({ sourceLanguage: "en", targetLanguage: props.target }),
      { initialProps: { target: "fr" } },
    );
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    await rerender({ target: "de" });
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(2));
  });

  test("gates the download behind create() and reaches ready on the gesture", async () => {
    const { Fake, create } = makeTranslatorFake({ status: "downloadable" });
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("downloadable"));
    expect(create).not.toHaveBeenCalled();

    result.current.create();

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("eager mode auto-creates from downloadable", async () => {
    const { Fake, create } = makeTranslatorFake({ status: "downloadable" });
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator(
        { sourceLanguage: "en", targetLanguage: "fr" },
        { mode: "eager" },
      ),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("surfaces a non-abort create failure as an error", async () => {
    const { Fake } = makeTranslatorFake({ failCreate: true });
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toBe("create failed");
  });
});

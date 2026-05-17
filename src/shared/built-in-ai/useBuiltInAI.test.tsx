import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useTranslator } from "./useTranslator";

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

  test("surfaces a non-abort create failure as an error", async () => {
    const { Fake } = makeTranslatorFake({ failCreate: true });
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toBe("create failed");
  });

  test("retries via create() after a non-abort error", async () => {
    let shouldFail = true;
    const create = vi.fn(() =>
      shouldFail
        ? Promise.reject(new Error("create failed"))
        : Promise.resolve({
            translate: (input: string) => Promise.resolve(`T:${input}`),
            translateStreaming: () => new ReadableStream<string>(),
            destroy: vi.fn(),
          }),
    );
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("error"));

    shouldFail = false;
    result.current.create();

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(create).toHaveBeenCalledTimes(2);
  });

  test("reports unsupported when the global yields no namespace", async () => {
    vi.stubGlobal("Translator", undefined);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(result.current.session).toBeNull();
  });

  test("parks at downloading until create() is called", async () => {
    const { Fake, create } = makeTranslatorFake({ status: "downloading" });
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("downloading"));
    expect(create).not.toHaveBeenCalled();

    result.current.create();

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("settles at unavailable when availability resolves to unavailable", async () => {
    const { Fake, create } = makeTranslatorFake({ status: "unavailable" });
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("unavailable"));
    expect(create).not.toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  test("surfaces an availability() failure as an error", async () => {
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.reject(new Error("availability boom"))),
      create: vi.fn(),
    });

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toBe("availability boom");
  });

  test("surfaces NotAllowedError from create() as gesture-required", async () => {
    const create = vi.fn(() =>
      Promise.reject(
        new DOMException("user activation required", "NotAllowedError"),
      ),
    );
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() =>
      expect(result.current.status).toBe("gesture-required"),
    );
    expect(result.current.error).toBeNull();
  });

  test("retries via create() after gesture-required", async () => {
    let needsGesture = true;
    const create = vi.fn(() =>
      needsGesture
        ? Promise.reject(
            new DOMException("user activation required", "NotAllowedError"),
          )
        : Promise.resolve({
            translate: (input: string) => Promise.resolve(`T:${input}`),
            destroy: vi.fn(),
          }),
    );
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() =>
      expect(result.current.status).toBe("gesture-required"),
    );

    needsGesture = false;
    result.current.create();

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
    expect(create).toHaveBeenCalledTimes(2);
  });

  test("destroys a session that resolves after unmount", async () => {
    const destroy = vi.fn();
    const session = {
      translate: (input: string) => Promise.resolve(`T:${input}`),
      destroy,
    };
    let resolveCreate!: (value: typeof session) => void;
    const create = vi.fn(
      () =>
        new Promise<typeof session>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    vi.stubGlobal("Translator", {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const { result, unmount } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("creating"));

    await unmount();

    resolveCreate(session);

    await vi.waitFor(() => expect(destroy).toHaveBeenCalledTimes(1));
  });
});

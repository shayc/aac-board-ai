import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { resetRegistry } from "../core/registry";
import { useTranslator } from "./presets";

function makeTranslatorFake() {
  const destroy = vi.fn();
  const create = vi.fn(() =>
    Promise.resolve({
      translate: (input: string) => Promise.resolve(`T:${input}`),
      translateStreaming: () => new ReadableStream<string>(),
      destroy,
    }),
  );
  return {
    Fake: { availability: vi.fn(() => Promise.resolve("available")), create },
    create,
    destroy,
  };
}

afterEach(() => {
  resetRegistry();
  vi.unstubAllGlobals();
});

describe("useTranslator", () => {
  test("transitions to available and runs", async () => {
    const { Fake } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    const { result } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );

    await vi.waitFor(() => expect(result.current.status).toBe("available"));
    await expect(result.current.run("hi")).resolves.toBe("T:hi");
  });

  test("releases the instance on unmount", async () => {
    const { Fake, destroy } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    const { result, unmount } = await renderHook(() =>
      useTranslator({ sourceLanguage: "en", targetLanguage: "fr" }),
    );
    await vi.waitFor(() => expect(result.current.status).toBe("available"));

    await unmount();
    await vi.waitFor(() => expect(destroy).toHaveBeenCalledTimes(1));
  });

  test("re-acquires when the identity changes", async () => {
    const { Fake, create } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    const { result, rerender } = await renderHook(
      (props: { target: string } = { target: "fr" }) =>
        useTranslator({ sourceLanguage: "en", targetLanguage: props.target }),
      { initialProps: { target: "fr" } },
    );
    await vi.waitFor(() => expect(result.current.status).toBe("available"));

    await rerender({ target: "de" });
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(2));
  });
});

import { describe, expect, test, vi } from "vitest";
import { abortError, mergeSignals, raceAbort } from "./signal";

describe("abortError", () => {
  test("returns a DOMException with name 'AbortError' for a string reason", () => {
    const error = abortError("nope");
    expect(error).toBeInstanceOf(DOMException);
    expect(error.name).toBe("AbortError");
    expect(error.message).toBe("nope");
  });

  test("passes through an existing AbortError unchanged", () => {
    const original = new DOMException("first", "AbortError");
    expect(abortError(original)).toBe(original);
  });

  test("wraps a non-AbortError DOMException", () => {
    const other = new DOMException("oops", "NotAllowedError");
    const wrapped = abortError(other);
    expect(wrapped).not.toBe(other);
    expect(wrapped.name).toBe("AbortError");
  });

  test("coerces unknown reasons to the literal 'Aborted'", () => {
    expect(abortError({ weird: true }).message).toBe("Aborted");
    expect(abortError(undefined).message).toBe("Aborted");
  });
});

describe("mergeSignals", () => {
  test("returns the sole present signal as-is (identity)", () => {
    const a = new AbortController().signal;
    expect(mergeSignals(a, undefined)).toBe(a);
    expect(mergeSignals(undefined, a)).toBe(a);
  });

  test("with no signals returns a non-aborted signal that never aborts on its own", () => {
    const merged = mergeSignals(undefined, undefined);
    expect(merged.aborted).toBe(false);
  });

  test("aborts when any of the input signals aborts", () => {
    const a = new AbortController();
    const b = new AbortController();
    const merged = mergeSignals(a.signal, b.signal);

    expect(merged.aborted).toBe(false);
    const reason = new DOMException("b fired", "AbortError");
    b.abort(reason);
    expect(merged.aborted).toBe(true);
    expect(merged.reason).toBe(reason);
  });
});

describe("raceAbort", () => {
  test("resolves with the promise value when the signal stays clear", async () => {
    const { signal } = new AbortController();
    await expect(raceAbort(Promise.resolve(42), signal)).resolves.toBe(42);
  });

  test("rejects with the signal reason when the signal aborts before the promise settles", async () => {
    const controller = new AbortController();
    const reason = new DOMException("stop", "AbortError");
    const pending = raceAbort(new Promise(() => undefined), controller.signal);
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
  });

  test("rejects immediately when called with an already-aborted signal", async () => {
    const controller = new AbortController();
    const reason = new DOMException("pre-aborted", "AbortError");
    controller.abort(reason);
    await expect(
      raceAbort(new Promise(() => undefined), controller.signal),
    ).rejects.toBe(reason);
  });

  test("rejects with the promise's own error when the signal stays clear", async () => {
    const { signal } = new AbortController();
    const original = new Error("inner");
    await expect(raceAbort(Promise.reject(original), signal)).rejects.toBe(
      original,
    );
  });

  test("aborts its cleanup signal once the promise resolves", async () => {
    const { signal } = new AbortController();
    const addSpy = vi.spyOn(signal, "addEventListener");

    await raceAbort(Promise.resolve("ok"), signal);

    const options = addSpy.mock.calls[0]?.[2] as
      | AddEventListenerOptions
      | undefined;
    expect(options?.signal?.aborted).toBe(true);
  });

  test("aborts its cleanup signal once the promise rejects", async () => {
    const { signal } = new AbortController();
    const addSpy = vi.spyOn(signal, "addEventListener");
    const inner = new Error("inner");

    await expect(raceAbort(Promise.reject(inner), signal)).rejects.toBe(inner);

    const options = addSpy.mock.calls[0]?.[2] as
      | AddEventListenerOptions
      | undefined;
    expect(options?.signal?.aborted).toBe(true);
  });
});

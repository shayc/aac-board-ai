import { afterEach, describe, expect, test, vi } from "vitest";
import {
  NoUserActivationError,
  UnavailableError,
  UnsupportedError,
} from "../errors.ts";
import { createProofreader } from "./create-proofreader.ts";

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

describe("createProofreader", () => {
  test("throws UnsupportedError when the Proofreader global is absent", async () => {
    vi.stubGlobal("Proofreader", undefined);
    await expect(
      createProofreader({ includeCorrectionTypes: true }),
    ).rejects.toBeInstanceOf(UnsupportedError);
  });

  test("throws UnavailableError when the model is unavailable", async () => {
    const create = vi.fn();
    vi.stubGlobal("Proofreader", {
      availability: vi.fn(() => Promise.resolve("unavailable")),
      create,
    });

    await expect(
      createProofreader({ includeCorrectionTypes: true }),
    ).rejects.toBeInstanceOf(UnavailableError);
    expect(create).not.toHaveBeenCalled();
  });

  test("throws NoUserActivationError when downloadable without a user gesture", async () => {
    setUserActivation(false);
    const create = vi.fn();
    vi.stubGlobal("Proofreader", {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create,
    });

    await expect(
      createProofreader({ includeCorrectionTypes: true }),
    ).rejects.toBeInstanceOf(NoUserActivationError);
    expect(create).not.toHaveBeenCalled();
  });

  test("creates a proofreader when available without requiring activation", async () => {
    const instance = {
      proofread: (input: string) =>
        Promise.resolve({ correctedInput: `P:${input}`, corrections: [] }),
      destroy: vi.fn(),
    };
    vi.stubGlobal("Proofreader", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve(instance)),
    });

    const proofreader = await createProofreader({
      includeCorrectionTypes: true,
    });

    const result = await proofreader.proofread("hi");
    expect(result.correctedInput).toBe("P:hi");
  });

  test("forwards the caller's AbortSignal to create()", async () => {
    const create = vi.fn(() => Promise.resolve({ destroy: vi.fn() }));
    vi.stubGlobal("Proofreader", {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const controller = new AbortController();
    await createProofreader({
      includeCorrectionTypes: true,
      signal: controller.signal,
    });

    const [createArg] = create.mock.calls[0] as unknown as [
      { signal?: AbortSignal },
    ];
    expect(createArg.signal).toBe(controller.signal);
  });

  test("does not pass signal into availability()", async () => {
    const availability = vi.fn(() => Promise.resolve("available" as const));
    vi.stubGlobal("Proofreader", {
      availability,
      create: vi.fn(() => Promise.resolve({ destroy: vi.fn() })),
    });

    const controller = new AbortController();
    await createProofreader({
      includeCorrectionTypes: true,
      signal: controller.signal,
    });

    const [arg] = availability.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ];
    expect(arg).not.toHaveProperty("signal");
    expect(arg).toEqual({ includeCorrectionTypes: true });
  });

  test("returned instance is AsyncDisposable and disposal destroys it", async () => {
    const destroy = vi.fn();
    const instance = {
      proofread: (input: string) =>
        Promise.resolve({ correctedInput: `P:${input}`, corrections: [] }),
      destroy,
    };
    vi.stubGlobal("Proofreader", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve(instance)),
    });

    {
      await using proofreader = await createProofreader({
        includeCorrectionTypes: true,
      });
      expect(typeof proofreader[Symbol.asyncDispose]).toBe("function");
      expect(destroy).not.toHaveBeenCalled();
    }

    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test("does not redefine [Symbol.asyncDispose] when the instance already implements it", async () => {
    const nativeDispose = vi.fn(() => Promise.resolve());
    const instance = {
      proofread: vi.fn(),
      destroy: vi.fn(),
      [Symbol.asyncDispose]: nativeDispose,
    };
    vi.stubGlobal("Proofreader", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve(instance)),
    });

    const proofreader = await createProofreader({
      includeCorrectionTypes: true,
    });
    expect(proofreader[Symbol.asyncDispose]).toBe(nativeDispose);
  });
});

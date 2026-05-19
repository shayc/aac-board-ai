import { afterEach, describe, expect, test, vi } from "vitest";
import {
  NoUserActivationError,
  UnavailableError,
  UnsupportedError,
} from "../errors.ts";
import { createRewriter } from "./create-rewriter.ts";

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

describe("createRewriter", () => {
  test("throws UnsupportedError when the Rewriter global is absent", async () => {
    vi.stubGlobal("Rewriter", undefined);
    await expect(
      createRewriter({ tone: "more-formal" }),
    ).rejects.toBeInstanceOf(UnsupportedError);
  });

  test("throws UnavailableError when the model is unavailable", async () => {
    const create = vi.fn();
    vi.stubGlobal("Rewriter", {
      availability: vi.fn(() => Promise.resolve("unavailable")),
      create,
    });

    await expect(
      createRewriter({ tone: "more-formal" }),
    ).rejects.toBeInstanceOf(UnavailableError);
    expect(create).not.toHaveBeenCalled();
  });

  test("throws NoUserActivationError when downloadable without a user gesture", async () => {
    setUserActivation(false);
    const create = vi.fn();
    vi.stubGlobal("Rewriter", {
      availability: vi.fn(() => Promise.resolve("downloadable")),
      create,
    });

    await expect(
      createRewriter({ tone: "more-formal" }),
    ).rejects.toBeInstanceOf(NoUserActivationError);
    expect(create).not.toHaveBeenCalled();
  });

  test("creates a rewriter when available without requiring activation", async () => {
    const instance = {
      rewrite: (input: string) => Promise.resolve(`R:${input}`),
      destroy: vi.fn(),
    };
    vi.stubGlobal("Rewriter", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve(instance)),
    });

    const rewriter = await createRewriter({ tone: "more-formal" });

    await expect(rewriter.rewrite("hi")).resolves.toBe("R:hi");
  });

  test("forwards the caller's AbortSignal to create()", async () => {
    const create = vi.fn(() => Promise.resolve({ destroy: vi.fn() }));
    vi.stubGlobal("Rewriter", {
      availability: vi.fn(() => Promise.resolve("available")),
      create,
    });

    const controller = new AbortController();
    await createRewriter({ tone: "more-formal", signal: controller.signal });

    const [createArg] = create.mock.calls[0] as unknown as [
      { signal?: AbortSignal },
    ];
    expect(createArg.signal).toBe(controller.signal);
  });

  test("does not pass signal into availability()", async () => {
    const availability = vi.fn(() => Promise.resolve("available" as const));
    vi.stubGlobal("Rewriter", {
      availability,
      create: vi.fn(() => Promise.resolve({ destroy: vi.fn() })),
    });

    const controller = new AbortController();
    await createRewriter({ tone: "more-formal", signal: controller.signal });

    const [arg] = availability.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ];
    expect(arg).not.toHaveProperty("signal");
    expect(arg).toEqual({ tone: "more-formal" });
  });

  test("returned instance is AsyncDisposable and disposal destroys it", async () => {
    const destroy = vi.fn();
    const instance = {
      rewrite: (input: string) => Promise.resolve(`R:${input}`),
      destroy,
    };
    vi.stubGlobal("Rewriter", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve(instance)),
    });

    {
      await using rewriter = await createRewriter({ tone: "more-formal" });
      expect(typeof rewriter[Symbol.asyncDispose]).toBe("function");
      expect(destroy).not.toHaveBeenCalled();
    }

    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test("does not redefine [Symbol.asyncDispose] when the instance already implements it", async () => {
    const nativeDispose = vi.fn(() => Promise.resolve());
    const instance = {
      rewrite: vi.fn(),
      destroy: vi.fn(),
      [Symbol.asyncDispose]: nativeDispose,
    };
    vi.stubGlobal("Rewriter", {
      availability: vi.fn(() => Promise.resolve("available")),
      create: vi.fn(() => Promise.resolve(instance)),
    });

    const rewriter = await createRewriter({ tone: "more-formal" });
    expect(rewriter[Symbol.asyncDispose]).toBe(nativeDispose);
  });
});

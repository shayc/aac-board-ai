import { afterEach, describe, expect, test, vi } from "vitest";
import { defineModel } from "./descriptor";
import { proofreader, translator } from "./descriptors";
import { BuiltInAIUnavailableError } from "./errors";
import { acquire, resetRegistry } from "./registry";

interface FakeOptions {
  availability?: Availability;
  failCreate?: boolean;
}

function progressEvent(loaded: number): Event {
  return Object.assign(new Event("downloadprogress"), { loaded });
}

function makeTranslatorFake({
  availability = "available",
  failCreate = false,
}: FakeOptions = {}) {
  const destroy = vi.fn();
  const create = vi.fn((options: { monitor?: (m: EventTarget) => void }) => {
    const monitor = new EventTarget();
    options.monitor?.(monitor);
    monitor.dispatchEvent(progressEvent(0.5));
    if (failCreate) {
      return Promise.reject(new Error("create failed"));
    }
    return Promise.resolve({
      translate: (input: string) => Promise.resolve(`T:${input}`),
      translateStreaming: () =>
        new ReadableStream<string>({
          start(controller) {
            controller.enqueue("ab");
            controller.enqueue("cd");
            controller.close();
          },
        }),
      destroy,
    });
  });
  return {
    Fake: { availability: vi.fn(() => Promise.resolve(availability)), create },
    create,
    destroy,
  };
}

// Wait past the 0 ms deferred teardown so destroy()/registry.delete have run.
const flushTeardown = () => new Promise((resolve) => setTimeout(resolve, 5));

afterEach(() => {
  resetRegistry();
  vi.unstubAllGlobals();
});

describe("registry", () => {
  test("unsupported when the global is absent", async () => {
    const missing = defineModel<{ x?: string }, unknown, string, string, false>(
      {
        name: "__NoSuchBuiltInAI__",
        run: () => Promise.resolve("never"),
      },
    );

    const handle = acquire(missing, {});

    expect(handle.getStatus().availability).toBe("unsupported");
    await expect(handle.run("hi")).rejects.toBeInstanceOf(
      BuiltInAIUnavailableError,
    );
  });

  test("reaches available and runs, surfacing download progress", async () => {
    const { Fake } = makeTranslatorFake({ availability: "downloadable" });
    vi.stubGlobal("Translator", Fake);

    const handle = acquire(translator, {
      sourceLanguage: "en",
      targetLanguage: "fr",
    });
    const seen: string[] = [];
    handle.subscribe(() => seen.push(handle.getStatus().availability));

    const result = await handle.run("hello");

    expect(result).toBe("T:hello");
    expect(handle.getStatus()).toEqual({
      availability: "available",
      progress: 1,
    });
    expect(seen).toContain("downloading");
  });

  test("rejects with a typed error when unavailable", async () => {
    const { Fake } = makeTranslatorFake({ availability: "unavailable" });
    vi.stubGlobal("Translator", Fake);

    const handle = acquire(translator, {
      sourceLanguage: "en",
      targetLanguage: "fr",
    });

    await expect(handle.run("hello")).rejects.toBeInstanceOf(
      BuiltInAIUnavailableError,
    );
  });

  test("reuses one instance for the same identity, ref-counted", async () => {
    const { Fake, create, destroy } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    const a = acquire(translator, {
      sourceLanguage: "en",
      targetLanguage: "fr",
    });
    const b = acquire(translator, {
      sourceLanguage: "EN",
      targetLanguage: "fr",
    });

    await a.run("x");
    await b.run("y");
    expect(create).toHaveBeenCalledTimes(1); // normalized identity matches

    a.release();
    await flushTeardown();
    expect(destroy).not.toHaveBeenCalled(); // still referenced by b

    b.release();
    await flushTeardown();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test("different identities get separate instances", async () => {
    const { Fake, create } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    await acquire(translator, {
      sourceLanguage: "en",
      targetLanguage: "fr",
    }).run("x");
    await acquire(translator, {
      sourceLanguage: "en",
      targetLanguage: "de",
    }).run("y");

    expect(create).toHaveBeenCalledTimes(2);
  });

  test("re-acquire within the grace window keeps the instance alive", async () => {
    const { Fake, create, destroy } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    const a = acquire(translator, {
      sourceLanguage: "en",
      targetLanguage: "fr",
    });
    await a.run("x");
    a.release();
    const b = acquire(translator, {
      sourceLanguage: "en",
      targetLanguage: "fr",
    });
    await flushTeardown();

    expect(destroy).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);

    b.release();
    await flushTeardown();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  test("streaming handle yields chunks; proofreader has no stream", async () => {
    const { Fake } = makeTranslatorFake();
    vi.stubGlobal("Translator", Fake);

    const handle = acquire(translator, {
      sourceLanguage: "en",
      targetLanguage: "fr",
    });
    const chunks: string[] = [];
    for await (const chunk of handle.stream("hi")) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(["ab", "cd"]);

    const proof = acquire(proofreader, {});
    expect(proof.stream).toBeUndefined();
  });
});

import { afterEach, describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  queueBoardTranslationPass,
  retryBoardTranslation,
  stopBoardTranslation,
  useBoardTranslationStatus,
} from "./board-translation-coordinator";
import type { TranslationOptions } from "./translate-board-sets";

interface HeldPass {
  pass: (options: TranslationOptions) => Promise<void>;
  options: () => TranslationOptions;
  hasStarted: () => boolean;
  finish: () => void;
}

function holdPass(): HeldPass {
  const { promise, resolve } = Promise.withResolvers<void>();
  let started: TranslationOptions | undefined;

  return {
    pass: (options) => {
      started = options;

      return promise;
    },
    options: () => {
      if (!started) {
        throw new Error("The pass has not started");
      }

      return started;
    },
    hasStarted: () => started !== undefined,
    finish: resolve,
  };
}

async function startPass(language: string): Promise<HeldPass> {
  const held = holdPass();
  queueBoardTranslationPass(language, held.pass);
  await expect.poll(held.hasStarted).toBe(true);

  return held;
}

const IDLE = { kind: "idle" };
const TRANSLATING = { kind: "translating" };

describe("board translation coordinator", () => {
  afterEach(stopBoardTranslation);

  test("reports a model download's progress until the translation starts", async () => {
    const { result } = await renderHook(() => useBoardTranslationStatus());
    const first = await startPass("es");

    first.options().onDownloadProgress(0);
    await expect
      .poll(() => result.current)
      .toEqual({ kind: "downloading", progress: 0 });

    first.options().onDownloadProgress(0.4);
    await expect
      .poll(() => result.current)
      .toEqual({ kind: "downloading", progress: 0.4 });

    first.options().onTranslating();
    await expect.poll(() => result.current).toEqual(TRANSLATING);
  });

  test("ends a pass that was refused a model download needing one, and translates on retry", async () => {
    const { result } = await renderHook(() => useBoardTranslationStatus());
    const passes: TranslationOptions[] = [];
    queueBoardTranslationPass("es", (options) => {
      passes.push(options);
      if (passes.length === 1) {
        options.onDownloadNeeded();
      }

      return Promise.resolve();
    });

    await expect.poll(() => result.current).toEqual({ kind: "needs-download" });

    retryBoardTranslation();

    await expect.poll(() => result.current).toEqual(IDLE);
    expect(passes).toHaveLength(2);
    expect(passes.at(1)?.signal.aborted).toBe(false);
  });

  test("keeps reporting the translation until a pass that needs a download ends", async () => {
    const { result } = await renderHook(() => useBoardTranslationStatus());
    const first = await startPass("es");

    first.options().onTranslating();
    first.options().onDownloadNeeded();
    await expect.poll(() => result.current).toEqual(TRANSLATING);

    first.finish();

    await expect.poll(() => result.current).toEqual({ kind: "needs-download" });
  });

  test("retrying with no pass queued does nothing", async () => {
    const { result } = await renderHook(() => useBoardTranslationStatus());

    retryBoardTranslation();

    expect(result.current).toEqual(IDLE);
  });

  test("reports translating from a pass's first progress until it ends", async () => {
    const { result } = await renderHook(() => useBoardTranslationStatus());
    const first = await startPass("es");

    expect(result.current).toEqual(IDLE);

    first.options().onTranslating();
    await expect.poll(() => result.current).toEqual(TRANSLATING);

    first.finish();
    await expect.poll(() => result.current).toEqual(IDLE);
  });

  test("queues a pass for the same language behind the one in progress without aborting it", async () => {
    const first = await startPass("es");
    const second = holdPass();

    queueBoardTranslationPass("es", second.pass);

    expect(second.hasStarted()).toBe(false);
    expect(first.options().signal.aborted).toBe(false);

    first.finish();

    await expect.poll(second.hasStarted).toBe(true);
    expect(second.options().signal).toBe(first.options().signal);
  });

  test("aborts the pass in progress and clears the status when the language changes", async () => {
    const { result } = await renderHook(() => useBoardTranslationStatus());
    const first = await startPass("es");
    first.options().onTranslating();
    await expect.poll(() => result.current).toEqual(TRANSLATING);

    const second = await startPass("fr");

    expect(first.options().signal.aborted).toBe(true);
    expect(second.options().signal.aborted).toBe(false);
    await expect.poll(() => result.current).toEqual(IDLE);
  });

  test("ignores status changes from a run the language change replaced", async () => {
    const { result } = await renderHook(() => useBoardTranslationStatus());
    const replaced = await startPass("es");
    const queuedBehindReplaced = holdPass();
    queueBoardTranslationPass("es", queuedBehindReplaced.pass);

    const current = await startPass("fr");

    replaced.options().onTranslating();
    replaced.options().onDownloadNeeded();
    expect(result.current).toEqual(IDLE);

    current.options().onTranslating();
    await expect.poll(() => result.current).toEqual(TRANSLATING);

    // The next pass of the replaced run starts only after the first has ended
    // and tried to clear the status.
    replaced.finish();
    await expect.poll(queuedBehindReplaced.hasStarted).toBe(true);

    expect(result.current).toEqual(TRANSLATING);
  });

  test("aborts the pass in progress and clears the status when stopped", async () => {
    const { result } = await renderHook(() => useBoardTranslationStatus());
    const first = await startPass("es");
    first.options().onTranslating();
    await expect.poll(() => result.current).toEqual(TRANSLATING);

    stopBoardTranslation();

    expect(first.options().signal.aborted).toBe(true);
    await expect.poll(() => result.current).toEqual(IDLE);
  });
});

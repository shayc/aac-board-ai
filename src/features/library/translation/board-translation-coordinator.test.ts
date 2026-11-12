import { afterEach, describe, expect, onTestFinished, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  queueBoardTranslationPass,
  stopBoardTranslation,
  useIsTranslatingBoards,
} from "./board-translation-coordinator";
import type { TranslationPassOptions } from "./translate-board-sets";

interface HeldPass {
  pass: (options: TranslationPassOptions) => Promise<void>;
  options: () => TranslationPassOptions;
  hasStarted: () => boolean;
  finish: () => void;
}

function holdPass(): HeldPass {
  const { promise, resolve } = Promise.withResolvers<void>();
  let started: TranslationPassOptions | undefined;

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

describe("board translation coordinator", () => {
  afterEach(stopBoardTranslation);

  test("reports translating from a pass's first progress until it ends", async () => {
    const { result } = await renderHook(() => useIsTranslatingBoards());
    const first = await startPass("es");

    expect(result.current).toBe(false);

    first.options().onTranslating();
    await expect.poll(() => result.current).toBe(true);

    first.finish();
    await expect.poll(() => result.current).toBe(false);
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
    const { result } = await renderHook(() => useIsTranslatingBoards());
    const first = await startPass("es");
    first.options().onTranslating();
    await expect.poll(() => result.current).toBe(true);

    const second = await startPass("fr");

    expect(first.options().signal.aborted).toBe(true);
    expect(second.options().signal.aborted).toBe(false);
    await expect.poll(() => result.current).toBe(false);
  });

  test("ignores status changes from a run the language change replaced", async () => {
    const { result } = await renderHook(() => useIsTranslatingBoards());
    const replaced = await startPass("es");
    const queuedBehindReplaced = holdPass();
    queueBoardTranslationPass("es", queuedBehindReplaced.pass);

    const current = await startPass("fr");

    replaced.options().onTranslating();
    expect(result.current).toBe(false);

    current.options().onTranslating();
    await expect.poll(() => result.current).toBe(true);

    replaced.finish();
    await expect.poll(queuedBehindReplaced.hasStarted).toBe(true);

    expect(result.current).toBe(true);
  });

  test("reports a failed pass and still runs the pass queued behind it", async () => {
    const reportedErrors: unknown[] = [];
    const recordError = (event: ErrorEvent) => {
      event.preventDefault();
      reportedErrors.push(event.error);
    };
    window.addEventListener("error", recordError);
    onTestFinished(() => window.removeEventListener("error", recordError));
    const failure = new Error("storage failure");
    const next = holdPass();

    queueBoardTranslationPass("es", () => Promise.reject(failure));
    queueBoardTranslationPass("es", next.pass);

    await expect.poll(next.hasStarted).toBe(true);
    expect(reportedErrors).toEqual([failure]);
  });

  test("aborts the pass in progress and clears the status when stopped", async () => {
    const { result } = await renderHook(() => useIsTranslatingBoards());
    const first = await startPass("es");
    first.options().onTranslating();
    await expect.poll(() => result.current).toBe(true);

    stopBoardTranslation();

    expect(first.options().signal.aborted).toBe(true);
    await expect.poll(() => result.current).toBe(false);
  });
});

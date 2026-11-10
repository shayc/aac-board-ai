import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import type { TranslationOptions } from "./translate-board-sets";

type TranslationPass = (options: TranslationOptions) => Promise<void>;

interface TranslationRun {
  readonly language: string;
  readonly abortController: AbortController;
  queue: Promise<void>;
}

const isTranslatingStore = createExternalStore(false);
let currentRun: TranslationRun | undefined;

/**
 * Runs `pass` after the passes already queued for `language`. Only a language
 * change aborts: a pass queued for the same language waits its turn, because
 * aborting could cancel a model download that, without the language change's
 * user gesture, can't start again.
 */
export function queueBoardTranslationPass(
  language: string,
  pass: TranslationPass,
): void {
  const run =
    currentRun?.language === language ? currentRun : startRun(language);

  run.queue = run.queue.then(async () => {
    try {
      await pass({
        signal: run.abortController.signal,
        onTranslating: () => setIsTranslating(run, true),
      });
    } catch (error) {
      // A failed pass must not stall the passes queued behind it.
      reportError(error);
    } finally {
      setIsTranslating(run, false);
    }
  });
}

export function stopBoardTranslation(): void {
  const run = currentRun;
  currentRun = undefined;
  run?.abortController.abort();
  isTranslatingStore.setState(false);
}

export function useIsTranslatingBoards(): boolean {
  return useExternalStore(isTranslatingStore);
}

function startRun(language: string): TranslationRun {
  stopBoardTranslation();

  currentRun = {
    language,
    abortController: new AbortController(),
    queue: Promise.resolve(),
  };

  return currentRun;
}

// A run replaced by a language change keeps settling in the background, and
// must not touch the status its successor now owns.
function setIsTranslating(run: TranslationRun, isTranslating: boolean) {
  if (currentRun === run) {
    isTranslatingStore.setState(isTranslating);
  }
}

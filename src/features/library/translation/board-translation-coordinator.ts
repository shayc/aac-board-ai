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
 * Queue same-language passes to preserve model downloads started by a user gesture.
 * Aborting those downloads would require another gesture to restart them.
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

// Superseded runs can still settle after the new language's run starts.
function setIsTranslating(run: TranslationRun, isTranslating: boolean) {
  if (currentRun === run) {
    isTranslatingStore.setState(isTranslating);
  }
}

import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import type { TranslationOptions } from "./translate-board-sets";

type TranslationPass = (options: TranslationOptions) => Promise<void>;

export type BoardTranslationStatus =
  | { kind: "idle" }
  | { kind: "downloading"; progress: number }
  | { kind: "translating" };

interface TranslationRun {
  readonly language: string;
  readonly abortController: AbortController;
  queue: Promise<void>;
}

const IDLE_STATUS: BoardTranslationStatus = { kind: "idle" };

const statusStore = createExternalStore<BoardTranslationStatus>(IDLE_STATUS);
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
        onDownloadProgress: (progress) =>
          setStatus(run, { kind: "downloading", progress }),
        onTranslating: () => setStatus(run, { kind: "translating" }),
      });
    } finally {
      setStatus(run, IDLE_STATUS);
    }
  });
}

export function stopBoardTranslation(): void {
  const run = currentRun;
  currentRun = undefined;
  run?.abortController.abort();
  statusStore.setState(IDLE_STATUS);
}

export function useBoardTranslationStatus(): BoardTranslationStatus {
  return useExternalStore(statusStore);
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
function setStatus(run: TranslationRun, status: BoardTranslationStatus) {
  if (currentRun === run) {
    statusStore.setState(status);
  }
}

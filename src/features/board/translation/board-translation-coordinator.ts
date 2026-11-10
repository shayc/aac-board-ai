import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import type {
  TranslationBlocker,
  TranslationOptions,
} from "./translate-board-sets";

type TranslationPass = (options: TranslationOptions) => Promise<void>;

export type BoardTranslationStatus =
  | { kind: "idle" }
  | { kind: "downloading"; progress: number }
  | { kind: "translating" }
  | { kind: TranslationBlocker };

interface TranslationRun {
  readonly language: string;
  readonly abortController: AbortController;
  queue: Promise<void>;
  lastPass?: TranslationPass;
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
  run.lastPass = pass;

  run.queue = run.queue.then(async () => {
    let blocker: TranslationBlocker | undefined;

    try {
      await pass({
        signal: run.abortController.signal,
        onDownloadProgress: (progress) =>
          setStatus(run, { kind: "downloading", progress }),
        onTranslating: () => setStatus(run, { kind: "translating" }),
        onBlocked: (reported) => {
          blocker = pickBlockerToShow(blocker, reported);
        },
      });
    } finally {
      setStatus(run, blocker ? { kind: blocker } : IDLE_STATUS);
    }
  });
}

/**
 * Queues the last pass again. Called from a click, its user gesture lets the
 * pass start the model download an earlier pass was refused.
 */
export function retryBoardTranslation(): void {
  if (currentRun?.lastPass) {
    queueBoardTranslationPass(currentRun.language, currentRun.lastPass);
  }
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

// A missing download is the one the user can act on, and the pass its
// download unblocks reports again whatever is still unavailable.
function pickBlockerToShow(
  current: TranslationBlocker | undefined,
  reported: TranslationBlocker,
): TranslationBlocker {
  return current === "needs-download" ? current : reported;
}

// A run replaced by a language change keeps settling in the background, and
// must not touch the status its successor now owns.
function setStatus(run: TranslationRun, status: BoardTranslationStatus) {
  if (currentRun === run) {
    statusStore.setState(status);
  }
}

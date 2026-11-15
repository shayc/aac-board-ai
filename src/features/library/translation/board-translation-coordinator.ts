import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import type {
  TranslationPassOptions,
  TranslationPassOutcome,
} from "./translate-board-sets";

type TranslationPass = (
  options: TranslationPassOptions,
) => Promise<TranslationPassOutcome>;

/** `incomplete`: the last pass left sets the browser cannot translate. */
export type BoardTranslationStatus = "idle" | "translating" | "incomplete";

interface TranslationRun {
  readonly language: string;
  readonly abortController: AbortController;
  queue: Promise<void>;
}

const statusStore = createExternalStore<BoardTranslationStatus>("idle");
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
      const outcome = await pass({
        signal: run.abortController.signal,
        onTranslating: () => setStatus(run, "translating"),
      });
      setStatus(run, outcome === "incomplete" ? "incomplete" : "idle");
    } catch (error) {
      setStatus(run, "idle");
      // A failed pass must not stall the passes queued behind it.
      reportError(error);
    }
  });
}

export function stopBoardTranslation(): void {
  const run = currentRun;
  currentRun = undefined;
  run?.abortController.abort();
  statusStore.setState("idle");
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

// Superseded runs can still settle after the new language's run starts.
function setStatus(run: TranslationRun, status: BoardTranslationStatus) {
  if (currentRun === run) {
    statusStore.setState(status);
  }
}

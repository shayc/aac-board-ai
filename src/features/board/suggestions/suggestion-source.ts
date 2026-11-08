import type { BaseHookReturn, Status } from "@shayc/react-built-in-ai";

export interface SuggestionSource {
  engineStatus: Status;
  candidate: string | undefined;
  isRequestPending: boolean;
  hasRequestFailed: boolean;
  enable: () => void;
}

export function isRequestFailure(error: Error | undefined): boolean {
  return error !== undefined && error.name !== "AbortError";
}

// Enabling is best-effort: the engine's status is the user-facing feedback, so
// a rejection here (e.g. the gesture expired) has nothing useful to add.
export function enableQuietly(engine: Pick<BaseHookReturn, "prepare">): void {
  void engine.prepare().catch(() => undefined);
}

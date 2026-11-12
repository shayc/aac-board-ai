import type { UseLatestAsyncReturn } from "@shared/hooks/use-latest-async";
import type { BaseHookReturn, Status } from "@shayc/react-built-in-ai";

export interface SuggestionSource {
  engineStatus: Status;
  candidate: string | undefined;
  isRequestPending: boolean;
  hasRequestFailed: boolean;
  enable: () => void;
}

export function toSuggestionSource(
  engine: Pick<BaseHookReturn, "status" | "prepare">,
  request: UseLatestAsyncReturn<string>,
): SuggestionSource {
  function enable() {
    // Engine status exposes preparation failures to the UI.
    void engine.prepare().catch(() => undefined);
  }

  return {
    engineStatus: engine.status,
    candidate: request.value,
    isRequestPending: request.isPending,
    hasRequestFailed: isRequestFailure(request.error),
    enable,
  };
}

function isRequestFailure(error: Error | undefined): boolean {
  return error !== undefined && error.name !== "AbortError";
}

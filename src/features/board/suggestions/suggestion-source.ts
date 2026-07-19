import type { Status } from "@shayc/react-built-in-ai";

export interface SuggestionSource {
  engineStatus: Status;
  candidate: string | undefined;
  isRequestPending: boolean;
  hasRequestFailed: boolean;
  prepare: () => void;
}

export function isRequestFailure(error: Error | undefined): boolean {
  return error !== undefined && error.name !== "AbortError";
}

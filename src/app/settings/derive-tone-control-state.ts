import type { Status } from "@shayc/react-built-in-ai";

export type ToneControlState = "hidden" | "disabled" | "enabled";

export function deriveToneControlState(status: Status): ToneControlState {
  switch (status) {
    case "unsupported":
    case "unavailable":
    case "error":
      return "hidden";
    case "downloadable":
    case "downloading":
      return "disabled";
    case "ready":
    case "checking":
      return "enabled";
    default:
      return status satisfies never;
  }
}

import type { BoardAction } from "../types";

export function parseAction(raw: string): BoardAction | null {
  if (raw.startsWith("+")) {
    return { kind: "spell", text: raw.slice(1).trim() };
  }
  switch (raw) {
    case ":space":
      return { kind: "space" };
    case ":backspace":
      return { kind: "backspace" };
    case ":clear":
      return { kind: "clear" };
    case ":home":
      return { kind: "home" };
    case ":speak":
      return { kind: "speak" };
    default:
      return null;
  }
}

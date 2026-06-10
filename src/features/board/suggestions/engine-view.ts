import type { BaseHookReturn } from "@shayc/react-built-in-ai";

export type EngineView =
  | { kind: "ready" }
  | { kind: "downloading"; progress: number }
  | { kind: "awaits-gesture" }
  | { kind: "initializing" }
  | { kind: "unavailable" }
  | { kind: "unsupported" };

export type EngineSnapshot = Pick<
  BaseHookReturn,
  "status" | "progress" | "error"
>;

export function deriveEngineView(engine: EngineSnapshot): EngineView {
  switch (engine.status) {
    case "unsupported":
      return { kind: "unsupported" };
    case "ready":
      return { kind: "ready" };
    case "downloading":
      return { kind: "downloading", progress: engine.progress };
    case "downloadable":
      return { kind: "awaits-gesture" };
    case "idle":
      return { kind: "initializing" };
    case "unavailable":
    case "error":
      return { kind: "unavailable" };
  }
}

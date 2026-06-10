import {
  MissingUserActivationError,
  type BaseHookReturn,
} from "@shayc/react-built-in-ai";
import {
  useEngineAvailability,
  type SuggestionEngineName,
} from "./use-engine-availability";

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

// Interprets the library lifecycle for humans. The lifecycle idles
// indefinitely when a download awaits the gesture Chrome requires, so the
// availability probe disambiguates idle: downloadable means parked on the
// user, anything else means still coming up.
export function deriveEngineView(
  engine: EngineSnapshot,
  availability: Availability | undefined,
): EngineView {
  switch (engine.status) {
    case "unsupported":
      return { kind: "unsupported" };
    case "ready":
      return { kind: "ready" };
    case "downloading":
      return { kind: "downloading", progress: engine.progress };
    case "unavailable":
      return { kind: "unavailable" };
    case "error":
      return engine.error instanceof MissingUserActivationError
        ? { kind: "awaits-gesture" }
        : { kind: "unavailable" };
    case "idle":
      return availability === "downloadable"
        ? { kind: "awaits-gesture" }
        : { kind: "initializing" };
  }
}

export function useEngineView(
  name: SuggestionEngineName,
  language: string,
  engine: EngineSnapshot,
): EngineView {
  const availability = useEngineAvailability(name, language);

  return deriveEngineView(engine, availability);
}

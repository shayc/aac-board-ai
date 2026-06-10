import type { BaseHookReturn } from "@shayc/react-built-in-ai";

// Best-effort warm-up: the engine's status is the user-facing feedback, so a
// rejection here (e.g. the gesture expired) has nothing useful to add.
export function prepareQuietly(engine: Pick<BaseHookReturn, "prepare">): void {
  void engine.prepare().catch(() => undefined);
}

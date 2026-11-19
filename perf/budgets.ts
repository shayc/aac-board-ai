export type Unit = "ms" | "kB";

export interface Budget {
  /** The timing a journey records, or a measurement the CLI takes itself. */
  name: string;
  label: string;
  unit: Unit;
  limit: number;
}

/**
 * Ordered by how often a user meets each one. Tap is the 100 ms perception
 * threshold; the rest sit about half again above what the lab measured (see
 * docs/performance.md). Timings run under the lab's CPU slowdown, except the
 * import, which runs at full speed.
 */
export const BUDGETS: Budget[] = [
  { name: "wordTap", label: "word tap", unit: "ms", limit: 100 },
  {
    name: "openBoardToGrid",
    label: "open linked board",
    unit: "ms",
    limit: 600,
  },
  { name: "homeToGrid", label: "home", unit: "ms", limit: 300 },
  {
    name: "returnVisit.toGrid",
    label: "return visit",
    unit: "ms",
    limit: 1000,
  },
  { name: "jsShipped", label: "JS shipped (gzip)", unit: "kB", limit: 430 },
  {
    name: "importBoardSet",
    label: "import Quick Core 60",
    unit: "ms",
    limit: 3000,
  },
  {
    name: "firstLaunch.toOnboarding",
    label: "first launch",
    unit: "ms",
    limit: 600,
  },
  {
    name: "firstLaunch.continueToGrid",
    label: "first board",
    unit: "ms",
    limit: 500,
  },
];

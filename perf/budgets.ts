export type Unit = "ms" | "kB";

export interface Budget {
  name: string;
  label: string;
  unit: Unit;
  limit: number;
}

/**
 * Ordered by user frequency. `wordTap` uses the 100 ms instant-feel threshold;
 * other limits sit ~1.5x above baseline so normal machine load stays green.
 */
export const BUDGETS: Budget[] = [
  { name: "wordTap", label: "word tap", unit: "ms", limit: 100 },
  {
    name: "openBoardToGrid",
    label: "open linked board",
    unit: "ms",
    limit: 600,
  },
  { name: "backToGrid", label: "back", unit: "ms", limit: 300 },
  {
    name: "returnVisit.toGrid",
    label: "return visit",
    unit: "ms",
    limit: 1000,
  },
  { name: "jsShipped", label: "JS shipped (gzip)", unit: "kB", limit: 420 },
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

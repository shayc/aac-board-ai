import type { Theme } from "@mui/material/styles";

type OffsetRules = Record<string, unknown>;

// MUI sizes a toolbar by breakpoint and orientation, so anything placed below
// one follows the same rules instead of repeating its heights.
export function toolbarOffset(theme: Theme, gutter: string): OffsetRules {
  return heightsToOffsets(theme.mixins.toolbar, gutter);
}

function heightsToOffsets(styles: object, gutter: string): OffsetRules {
  const entries: [string, unknown][] = Object.entries(styles);
  const rules: OffsetRules = {};

  for (const [key, value] of entries) {
    if (key === "minHeight" && typeof value === "number") {
      rules.top = `calc(${value}px + ${gutter})`;
    } else if (typeof value === "object" && value !== null) {
      rules[key] = heightsToOffsets(value, gutter);
    }
  }

  return rules;
}

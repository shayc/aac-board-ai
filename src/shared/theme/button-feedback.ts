import type { Theme } from "@mui/material/styles";

// iOS WebKit reapplies :active during synthetic mouse events after a tap,
// so any release transition flashes twice; keep touch feedback instant.
export const instantFeedbackOnTouch = {
  "@media (hover: none)": {
    transitionDuration: "0ms",
  },
} as const;

export function buttonFeedbackTiming(theme: Theme) {
  const { duration, easing } = transitionOptions(theme);

  return {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: easing,
    ...instantFeedbackOnTouch,
    "&:active": {
      transitionDuration: "0ms",
    },
  };
}

export function buttonFeedbackTransition(
  theme: Theme,
  properties: string[],
): string {
  return theme.transitions.create(properties, transitionOptions(theme));
}

function transitionOptions(theme: Theme) {
  return {
    duration: theme.transitions.duration.shortest,
    easing: theme.transitions.easing.easeOut,
  };
}

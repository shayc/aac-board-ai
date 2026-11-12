import type { Theme } from "@mui/material/styles";

// WebKit on iOS reapplies :active while it dispatches the mouse events that
// follow a tap, so a release transition replays the press as a second flash.
export const instantReleaseOnTouch = {
  "@media (hover: none)": {
    transitionDuration: "0ms",
  },
} as const;

export function buttonFeedbackTiming(theme: Theme) {
  const { duration, easing } = transitionOptions(theme);

  return {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: easing,
    ...instantReleaseOnTouch,
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

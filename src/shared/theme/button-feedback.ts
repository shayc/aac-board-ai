import type { Theme } from "@mui/material/styles";

function buttonFeedbackEasing(theme: Theme) {
  return {
    duration: theme.transitions.duration.shortest,
    easing: theme.transitions.easing.easeOut,
  };
}

export function buttonFeedbackTiming(theme: Theme) {
  const { duration, easing } = buttonFeedbackEasing(theme);

  return {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: easing,
    "&:active": {
      transitionDuration: "0ms",
    },
  };
}

// For anything that has to change in step with a button's own colors.
export function buttonFeedbackTransition(
  theme: Theme,
  properties: string[],
): string {
  return theme.transitions.create(properties, buttonFeedbackEasing(theme));
}

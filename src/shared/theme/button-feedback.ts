import type { Theme } from "@mui/material/styles";

function transitionOptions(theme: Theme) {
  return {
    duration: theme.transitions.duration.shortest,
    easing: theme.transitions.easing.easeOut,
  };
}

export function buttonFeedbackTiming(theme: Theme) {
  const { duration, easing } = transitionOptions(theme);

  return {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: easing,
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

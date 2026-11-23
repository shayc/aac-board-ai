import type { Theme } from "@mui/material/styles";
import { shortLandscape } from "@shared/theme/short-landscape";

export const CONTROL_SIZES = { medium: 64, large: 80 } as const;

export const CONTROL_ICON_SIZE = 32;

const CONTROL_SIZE_PROPERTY = "--control-size";

// The board sets it once, so the bar and every round control agree.
export const CONTROL_SIZE = `var(${CONTROL_SIZE_PROPERTY}, ${CONTROL_SIZES.large}px)`;

export function controlSizeSx(theme: Theme) {
  return {
    [CONTROL_SIZE_PROPERTY]: `${CONTROL_SIZES.large}px`,
    [shortLandscape(theme)]: {
      [CONTROL_SIZE_PROPERTY]: `${CONTROL_SIZES.medium}px`,
    },
  };
}

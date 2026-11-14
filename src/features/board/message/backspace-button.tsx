import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import IconButton, { iconButtonClasses } from "@mui/material/IconButton";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { useState } from "react";
import { mergeProps, useLongPress, usePress } from "react-aria";
import { MESSAGE_ACTION_SIZE } from "./message-bar";

const RING_DELAY_MS = 300;
const RING_FILL_MS = 300;
const LONG_PRESS_THRESHOLD_MS = RING_DELAY_MS + RING_FILL_MS;
const ICON_SIZE = 28;
const DISC_INSET = 1;

const ringFillSx = {
  [`& .${circularProgressClasses.circle}`]: {
    transition: `stroke-dashoffset ${RING_FILL_MS}ms linear ${RING_DELAY_MS}ms`,
  },
} as const;

interface BackspaceButtonProps {
  disabled?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function BackspaceButton({
  disabled = false,
  onPress,
  onLongPress,
}: BackspaceButtonProps) {
  const t = useTranslate();
  const [isHolding, setIsHolding] = useState(false);
  const { pressProps } = usePress({ isDisabled: disabled, onPress });

  const { longPressProps } = useLongPress({
    accessibilityDescription: t(m.messageBackspaceLongPressHint),
    isDisabled: disabled,
    threshold: LONG_PRESS_THRESHOLD_MS,
    onLongPress,
    onLongPressStart: () => setIsHolding(true),
    onLongPressEnd: () => setIsHolding(false),
  });

  return (
    <IconButton
      {...mergeProps(pressProps, longPressProps)}
      {...focusableDisabledProps(disabled)}
      aria-label={t(m.messageBackspace)}
      sx={backspaceSx}
    >
      <BackspaceOutlinedIcon fontSize="inherit" sx={flipForRTL} />

      <CircularProgress
        aria-hidden
        variant="determinate"
        value={isHolding ? 100 : 0}
        size="auto"
        sx={[ringSx, isHolding && ringFillSx]}
      />
    </IconButton>
  );
}

// The disc is the button's content box, so the touch target keeps the full
// action size. With the bar's inset, the disc sits on the bar's rounded end,
// the same distance from its top, bottom and end, and both curves run
// parallel.
//
// The bar stays light in dark mode, so the disc stays a dark tint of it with a
// dark icon; on the greyer bar it needs a stronger tint, and a stronger
// disabled icon, to read at all.
function backspaceSx(theme: Theme) {
  const discColor = theme.alpha(theme.palette.common.black, 0.05);
  const darkDiscColor = theme.alpha(theme.palette.common.black, 0.12);

  const discSelector = `&, &:hover, &.${iconButtonClasses.disabled}`;

  return {
    flexShrink: 0,
    width: MESSAGE_ACTION_SIZE,
    height: MESSAGE_ACTION_SIZE,
    padding: DISC_INSET,
    backgroundClip: "content-box",
    fontSize: ICON_SIZE,
    color: "text.primary",
    [discSelector]: { backgroundColor: discColor },
    "&::before": { inset: theme.spacing(DISC_INSET) },
    ...theme.applyStyles("dark", {
      [discSelector]: { backgroundColor: darkDiscColor },
      [`&.${iconButtonClasses.disabled}`]: {
        color: theme.vars.palette.text.disabled,
      },
    }),
  } as const;
}

// The ring traces the disc's edge. It fills by CSS transition, so a tap
// released within the delay never shows it, and it completes exactly when the
// long press clears the message.
function ringSx(theme: Theme) {
  return {
    position: "absolute",
    inset: theme.spacing(DISC_INSET),
    pointerEvents: "none",
    [`& .${circularProgressClasses.circle}`]: { transition: "none" },
  } as const;
}

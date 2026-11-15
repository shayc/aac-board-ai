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
import { ShortcutTooltip } from "@shared/ui/shortcut-tooltip";
import { useState } from "react";
import { mergeProps, useLongPress, usePress } from "react-aria";
import type { BoardShortcutLabels } from "../shortcuts/shortcut-labels";
import { MESSAGE_ACTION_SIZE } from "./message-bar";

const RING_DELAY_MS = 300;
const RING_FILL_MS = 300;
const LONG_PRESS_THRESHOLD_MS = RING_DELAY_MS + RING_FILL_MS;
const ICON_SIZE = 28;
const DISC_INSET = 1;

interface BackspaceButtonProps {
  disabled?: boolean;
  shortcutLabels: Pick<BoardShortcutLabels, "backspace" | "clear">;
  onPress: () => void;
  onLongPress: () => void;
}

export function BackspaceButton({
  disabled = false,
  shortcutLabels,
  onPress,
  onLongPress,
}: BackspaceButtonProps) {
  const t = useTranslate();
  const [isHolding, setIsHolding] = useState(false);
  const { pressProps } = usePress({ isDisabled: disabled, onPress });

  const { longPressProps } = useLongPress({
    accessibilityDescription: t(m.messageBackspaceLongPressHint, {
      shortcut: shortcutLabels.clear.spokenKeys,
    }),
    isDisabled: disabled,
    threshold: LONG_PRESS_THRESHOLD_MS,
    onLongPress,
    onLongPressStart: () => setIsHolding(true),
    onLongPressEnd: () => setIsHolding(false),
  });

  return (
    <ShortcutTooltip
      action={t(m.messageClear)}
      keys={shortcutLabels.clear.keys}
    >
      <IconButton
        {...mergeProps(pressProps, longPressProps)}
        {...focusableDisabledProps(disabled)}
        aria-label={t(m.messageBackspace)}
        aria-keyshortcuts={shortcutLabels.backspace.ariaKeyShortcuts}
        sx={backspaceSx}
      >
        <BackspaceOutlinedIcon fontSize="inherit" sx={flipForRTL} />

        <CircularProgress
          aria-hidden
          color="inherit"
          variant="determinate"
          value={isHolding ? 100 : 0}
          size="auto"
          sx={(theme) => ringSx(theme, isHolding)}
        />
      </IconButton>
    </ShortcutTooltip>
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

// The "auto" size lets the insets stretch the ring to the disc's edge. The fill
// waits out the delay so a quick tap never shows it.
function ringSx(theme: Theme, isHolding: boolean) {
  const fillTransition = `stroke-dashoffset ${RING_FILL_MS}ms linear ${RING_DELAY_MS}ms`;

  return {
    position: "absolute",
    inset: theme.spacing(DISC_INSET),
    pointerEvents: "none",
    [`& .${circularProgressClasses.circle}`]: {
      transition: isHolding ? fillTransition : "none",
    },
  } as const;
}

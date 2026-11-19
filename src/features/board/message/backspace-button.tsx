import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import IconButton, { iconButtonClasses } from "@mui/material/IconButton";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { BackspaceIcon } from "@shared/ui/icons";
import { ShortcutTooltip } from "@shared/ui/shortcut-tooltip";
import { useState } from "react";
import { mergeProps, useLongPress, usePress } from "react-aria";
import {
  CONTROL_ICON_SIZE,
  MESSAGE_CONTROL_SIZE,
} from "../board-control-sizes";
import { BOARD_SHORTCUT_ARIA_KEYS } from "../shortcuts/resolve-board-shortcut";
import type { BoardShortcutLabels } from "../shortcuts/use-board-shortcut-labels";

const RING_DELAY_MS = 300;
const RING_FILL_MS = 300;
const LONG_PRESS_THRESHOLD_MS = RING_DELAY_MS + RING_FILL_MS;
// MUI draws the ring in a 44-unit box, so on the 80px button this is a 4px
// stroke; MUI's default would outweigh the icon's lines.
const RING_THICKNESS = 2.2;

interface BackspaceButtonProps {
  disabled?: boolean;
  shortcutLabels: Pick<BoardShortcutLabels, "clear" | "spokenClear">;
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
      shortcut: shortcutLabels.spokenClear,
    }),
    isDisabled: disabled,
    threshold: LONG_PRESS_THRESHOLD_MS,
    onLongPress,
    onLongPressStart: () => setIsHolding(true),
    onLongPressEnd: () => setIsHolding(false),
  });

  return (
    <ShortcutTooltip action={t(m.messageClear)} keys={shortcutLabels.clear}>
      <IconButton
        {...mergeProps(pressProps, longPressProps)}
        {...focusableDisabledProps(disabled)}
        aria-label={t(m.messageBackspace)}
        aria-keyshortcuts={BOARD_SHORTCUT_ARIA_KEYS.backspace}
        sx={backspaceSx}
      >
        <BackspaceIcon fontSize="inherit" sx={flipForRTL} />

        <CircularProgress
          aria-hidden
          color="inherit"
          variant="determinate"
          value={isHolding ? 100 : 0}
          size="auto"
          thickness={RING_THICKNESS}
          sx={ringSx(isHolding)}
        />
      </IconButton>
    </ShortcutTooltip>
  );
}

// A tonal fill like MUI's filled Chip, lighter than play's. The bar's light
// scheme resolves the action tokens in both themes. MUI clears a disabled icon
// button's fill; it stays to keep the button's shape, and the dark-mode bar's
// grey needs a heavier disabled icon.
function backspaceSx(theme: Theme) {
  const { action } = theme.vars.palette;

  return {
    flexShrink: 0,
    width: MESSAGE_CONTROL_SIZE,
    height: MESSAGE_CONTROL_SIZE,
    fontSize: CONTROL_ICON_SIZE,
    color: "text.primary",
    [`&, &.${iconButtonClasses.disabled}`]: {
      backgroundColor: action.selected,
    },
    // A tap leaves hover stuck on a touch screen.
    "&:hover": {
      "@media (hover: hover)": {
        backgroundColor: theme.alpha(
          action.selected,
          `${action.selectedOpacity} + ${action.hoverOpacity}`,
        ),
      },
    },
    ...theme.applyStyles("dark", {
      [`&.${iconButtonClasses.disabled}`]: {
        color: theme.vars.palette.text.disabled,
      },
    }),
  } as const;
}

// The "auto" size stretches the ring over the whole touch target. The fill
// waits out the delay so a quick tap never shows it.
function ringSx(isHolding: boolean) {
  const fillTransition = `stroke-dashoffset ${RING_FILL_MS}ms linear ${RING_DELAY_MS}ms`;

  return {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    [`& .${circularProgressClasses.circle}`]: {
      transition: isHolding ? fillTransition : "none",
    },
  } as const;
}

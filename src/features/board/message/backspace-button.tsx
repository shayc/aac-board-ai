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
import { BOARD_SHORTCUT_ARIA_KEYS } from "../shortcuts/resolve-board-shortcut";
import type { BoardShortcutLabels } from "../shortcuts/use-board-shortcut-labels";
import { MESSAGE_SECONDARY_ACTION_SIZE } from "./message-bar";

const RING_DELAY_MS = 300;
const RING_FILL_MS = 300;
const LONG_PRESS_THRESHOLD_MS = RING_DELAY_MS + RING_FILL_MS;
// MUI draws the ring in a 44-unit box, so on the 64px button this is about a
// 3px stroke; MUI's default would outweigh the icon's lines.
const RING_THICKNESS = 2.2;
const ICON_SIZE = 28;

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
        <BackspaceOutlinedIcon fontSize="inherit" sx={flipForRTL} />

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

// The icon has no fill at rest, so play is the only filled shape in the bar;
// the touch target stays as large as the button. On a phone, where it is the
// bar's last action, the bar's inset leaves it the same distance from the
// bar's top, bottom and rounded end.
//
// The bar stays light in dark mode, so hovering tints it darker; on the greyer
// bar that tint, and the disabled icon, must be stronger to read at all.
function backspaceSx(theme: Theme) {
  const hoverColor = theme.alpha(theme.palette.common.black, 0.08);
  const darkHoverColor = theme.alpha(theme.palette.common.black, 0.12);

  return {
    flexShrink: 0,
    width: MESSAGE_SECONDARY_ACTION_SIZE,
    height: MESSAGE_SECONDARY_ACTION_SIZE,
    fontSize: ICON_SIZE,
    color: "text.primary",
    // A tap leaves hover stuck on a touch screen.
    "&:hover": {
      "@media (hover: hover)": { backgroundColor: hoverColor },
    },
    ...theme.applyStyles("dark", {
      "&:hover": {
        "@media (hover: hover)": { backgroundColor: darkHoverColor },
      },
      [`&.${iconButtonClasses.disabled}`]: {
        color: theme.vars.palette.text.disabled,
      },
    }),
  } as const;
}

// The "auto" size stretches the ring over the whole button, so a hold shows
// the edge of the touch target. The fill waits out the delay so a quick tap
// never shows it.
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

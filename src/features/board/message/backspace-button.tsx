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
import { MESSAGE_ACTION_SIZE } from "./message-bar";

const RING_DELAY_MS = 300;
const RING_FILL_MS = 300;
const LONG_PRESS_THRESHOLD_MS = RING_DELAY_MS + RING_FILL_MS;
// 4px stroke on the 80px disc (MUI scales thickness against a 44-unit viewBox).
const RING_THICKNESS = 2.2;

// A step smaller beside the play button, so play stays the bar's main action.
const BUTTON_SIZES = {
  medium: { disc: 64, icon: 24 },
  large: { disc: MESSAGE_ACTION_SIZE, icon: 28 },
} as const;

type BackspaceButtonSize = keyof typeof BUTTON_SIZES;

interface BackspaceButtonProps {
  disabled?: boolean;
  size?: BackspaceButtonSize;
  shortcutLabels: Pick<BoardShortcutLabels, "clear" | "spokenClear">;
  onPress: () => void;
  onLongPress: () => void;
}

export function BackspaceButton({
  disabled = false,
  size = "large",
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
        sx={(theme) => backspaceSx(theme, size)}
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

// The message bar stays light in dark mode but uses a greyer fill, so the disc
// and disabled icon need stronger dark tints.
function backspaceSx(theme: Theme, size: BackspaceButtonSize) {
  const { disc, icon } = BUTTON_SIZES[size];
  const discColor = theme.alpha(theme.palette.common.black, 0.05);
  const darkDiscColor = theme.alpha(theme.palette.common.black, 0.12);

  const discSelector = `&, &:hover, &.${iconButtonClasses.disabled}`;

  return {
    flexShrink: 0,
    width: disc,
    height: disc,
    fontSize: icon,
    color: "text.primary",
    [discSelector]: { backgroundColor: discColor },
    ...theme.applyStyles("dark", {
      [discSelector]: { backgroundColor: darkDiscColor },
      [`&.${iconButtonClasses.disabled}`]: {
        color: theme.vars.palette.text.disabled,
      },
    }),
  } as const;
}

// Delay the fill transition so a normal tap never flashes the progress ring.
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

import IconButton, { iconButtonClasses } from "@mui/material/IconButton";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { BackspaceIcon } from "@shared/ui/icons";
import { mergeProps, useLongPress, usePress } from "react-aria";
import { MESSAGE_ACTION_SIZE } from "./message-bar";

const LONG_PRESS_THRESHOLD_MS = 600;
const ICON_SIZE = 28;
const DISC_INSET = 1;

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
  const { pressProps } = usePress({ isDisabled: disabled, onPress });

  const { longPressProps } = useLongPress({
    accessibilityDescription: t(m.messageBackspaceLongPressHint),
    isDisabled: disabled,
    threshold: LONG_PRESS_THRESHOLD_MS,
    onLongPress,
  });

  return (
    <IconButton
      {...mergeProps(pressProps, longPressProps)}
      {...focusableDisabledProps(disabled)}
      aria-label={t(m.messageBackspace)}
      sx={backspaceSx}
    >
      <BackspaceIcon fontSize="inherit" sx={flipForRTL} />
    </IconButton>
  );
}

// The disc is the button's content box, so the touch target keeps the full
// action size. With the bar's inset, the disc sits on the bar's rounded end,
// the same distance from its top, bottom and end, and both curves run
// parallel.
function backspaceSx(theme: Theme) {
  const discColor = theme.alpha(theme.palette.common.black, 0.05);
  const darkDiscColor = theme.alpha(theme.palette.common.white, 0.38);

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
    }),
  } as const;
}

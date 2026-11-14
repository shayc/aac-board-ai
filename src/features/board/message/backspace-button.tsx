import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import IconButton from "@mui/material/IconButton";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeProps, useLongPress, usePress } from "react-aria";
import { MESSAGE_ACTION_ICON_SIZE, MESSAGE_ACTION_SIZE } from "./message-bar";

const LONG_PRESS_THRESHOLD_MS = 600;

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
      sx={{
        flexShrink: 0,
        // With the bar's inset, the circle sits on the bar's rounded end and
        // both curves run parallel.
        width: MESSAGE_ACTION_SIZE,
        height: MESSAGE_ACTION_SIZE,
        fontSize: MESSAGE_ACTION_ICON_SIZE,
      }}
    >
      <BackspaceOutlinedIcon fontSize="inherit" sx={flipForRTL} />
    </IconButton>
  );
}

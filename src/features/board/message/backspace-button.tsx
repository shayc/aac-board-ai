import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import IconButton from "@mui/material/IconButton";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeProps, useLongPress, usePress } from "react-aria";
import { PLAY_BUTTON_SIZE, PLAY_ICON_SIZE } from "./play-button";

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
        // Play's footprint and icon, so with the bar's inset the circle sits
        // on the bar's rounded end and both curves run parallel.
        width: PLAY_BUTTON_SIZE,
        height: PLAY_BUTTON_SIZE,
        fontSize: PLAY_ICON_SIZE,
      }}
    >
      <BackspaceOutlinedIcon fontSize="inherit" sx={flipForRTL} />
    </IconButton>
  );
}

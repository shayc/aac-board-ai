import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import IconButton from "@mui/material/IconButton";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeProps, useLongPress, usePress } from "react-aria";

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
      size="large"
      sx={{
        flexShrink: 0,
        // Mirrors the first word's inset from the bar's start edge.
        marginInlineEnd: 0.5,
        // The wide glyph reads as large as play's triangle and circle together
        // at this size, so it stays secondary to play.
        fontSize: 32,
      }}
    >
      <BackspaceOutlinedIcon fontSize="inherit" sx={flipForRTL} />
    </IconButton>
  );
}

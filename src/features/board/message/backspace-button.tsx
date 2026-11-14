import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import IconButton, { iconButtonClasses } from "@mui/material/IconButton";
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
        // With the bar's inset, this centers the circle on the bar's rounded
        // end so both curves run parallel.
        marginInlineEnd: 1.75,
        // Neutral like the board's other controls, so it doesn't read as part
        // of the message.
        color: "action.active",
        backgroundColor: "action.selected",
        "&:hover": { backgroundColor: "action.focus" },
        [`&.${iconButtonClasses.disabled}`]: {
          color: "action.disabled",
          backgroundColor: "action.selected",
        },
      }}
    >
      <BackspaceOutlinedIcon fontSize="inherit" sx={flipForRTL} />
    </IconButton>
  );
}

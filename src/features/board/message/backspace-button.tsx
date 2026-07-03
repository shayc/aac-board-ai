import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import IconButton from "@mui/material/IconButton";
import { m } from "@paraglide/messages.js";
import { flipForRtl } from "@shared/theme/rtl";
import { mergeProps, useLongPress, usePress } from "react-aria";

const LONG_PRESS_THRESHOLD_MS = 600;

export interface BackspaceButtonProps {
  disabled?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function BackspaceButton({
  disabled,
  onPress,
  onLongPress,
}: BackspaceButtonProps) {
  const { pressProps } = usePress({ onPress });

  const { longPressProps } = useLongPress({
    accessibilityDescription: m.messageBackspaceLongPressHint(),
    threshold: LONG_PRESS_THRESHOLD_MS,
    onLongPress,
  });

  return (
    <IconButton
      {...mergeProps(pressProps, longPressProps)}
      aria-label={m.messageBackspace()}
      size="large"
      disabled={disabled}
    >
      <BackspaceOutlinedIcon sx={flipForRtl} />
    </IconButton>
  );
}

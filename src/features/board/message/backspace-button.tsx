import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import Button from "@mui/material/Button";
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
    <Button
      {...mergeProps(pressProps, longPressProps)}
      aria-label={m.messageBackspace()}
      size="large"
      color="inherit"
      disabled={disabled}
      variant="contained"
      sx={{ width: 72 }}
    >
      <BackspaceOutlinedIcon sx={flipForRtl} />
    </Button>
  );
}

import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRtl } from "@shared/theme/rtl";
import { mergeProps, useLongPress, usePress } from "react-aria";

const LONG_PRESS_THRESHOLD_MS = 600;

interface BackspaceButtonProps {
  disabled?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function BackspaceButton({
  disabled,
  onPress,
  onLongPress,
}: BackspaceButtonProps) {
  const t = useTranslate();
  const { pressProps } = usePress({ onPress });

  const { longPressProps } = useLongPress({
    accessibilityDescription: t(m.messageBackspaceLongPressHint),
    threshold: LONG_PRESS_THRESHOLD_MS,
    onLongPress,
  });

  return (
    <Button
      {...mergeProps(pressProps, longPressProps)}
      aria-label={t(m.messageBackspace)}
      disabled={disabled}
      size="large"
      color="inherit"
      variant="contained"
      sx={{ width: 72 }}
    >
      <BackspaceOutlinedIcon sx={flipForRtl} />
    </Button>
  );
}

import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { mergeProps, useLongPress, usePress } from "react-aria";
import { BoardControlButton } from "../board-control-button";

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
    <BoardControlButton
      {...mergeProps(pressProps, longPressProps)}
      aria-label={t(m.messageBackspace)}
      disabled={disabled}
    >
      <BackspaceOutlinedIcon sx={flipForRTL} />
    </BoardControlButton>
  );
}

import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import Button, { type ButtonProps } from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { mergeSx } from "@shared/theme/merge-sx";
import { flipForRtl } from "@shared/theme/rtl";
import { mergeProps, useLongPress, usePress } from "react-aria";

const LONG_PRESS_THRESHOLD_MS = 600;

interface BackspaceButtonOwnProps {
  onPress: () => void;
  onLongPress: () => void;
}

type BackspaceButtonProps = BackspaceButtonOwnProps &
  Omit<
    ButtonProps,
    | keyof BackspaceButtonOwnProps
    | "aria-label"
    | "children"
    | "color"
    | "size"
    | "variant"
  >;

export function BackspaceButton({
  onPress,
  onLongPress,
  sx,
  ...buttonProps
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
      {...mergeProps(buttonProps, pressProps, longPressProps)}
      aria-label={t(m.messageBackspace)}
      size="large"
      color="inherit"
      variant="contained"
      sx={mergeSx({ width: 72 }, sx)}
    >
      <BackspaceOutlinedIcon sx={flipForRtl} />
    </Button>
  );
}

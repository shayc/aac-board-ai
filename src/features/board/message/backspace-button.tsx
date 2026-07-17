import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import Button, { type ButtonProps } from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { mergeSx } from "@shared/theme/merge-sx";
import { flipForRtl } from "@shared/theme/rtl";
import { mergeProps, useLongPress, usePress } from "react-aria";

const LONG_PRESS_THRESHOLD_MS = 600;

interface BackspaceButtonOwnProps {
  onPress: () => void;
  onLongPress: () => void;
}

export type BackspaceButtonProps = BackspaceButtonOwnProps &
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
  const { pressProps } = usePress({ onPress });

  const { longPressProps } = useLongPress({
    accessibilityDescription: m.messageBackspaceLongPressHint(),
    threshold: LONG_PRESS_THRESHOLD_MS,
    onLongPress,
  });

  return (
    <Button
      {...mergeProps(buttonProps, pressProps, longPressProps)}
      aria-label={m.messageBackspace()}
      size="large"
      color="inherit"
      variant="contained"
      sx={mergeSx({ width: 96 }, sx)}
    >
      <BackspaceOutlinedIcon sx={flipForRtl} />
    </Button>
  );
}

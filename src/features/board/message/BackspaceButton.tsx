import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { mergeProps, useLongPress, usePress } from "react-aria";

const RING_DELAY_MS = 300;
const RING_FILL_MS = 300;
export const LONG_PRESS_THRESHOLD_MS = RING_DELAY_MS + RING_FILL_MS;

const StyledCircularProgress = styled(CircularProgress, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ active }) => ({
  "& svg circle": {
    transitionProperty: "stroke-dashoffset",
    transitionDuration: active ? `${RING_FILL_MS}ms` : "0ms",
    transitionTimingFunction: "linear",
    transitionDelay: active ? `${RING_DELAY_MS}ms` : "0ms",
  },
}));

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
  const [progress, setProgress] = useState(0);

  const { pressProps } = usePress({ onPress });

  const { longPressProps } = useLongPress({
    accessibilityDescription: "Long press to clear message",
    threshold: LONG_PRESS_THRESHOLD_MS,
    onLongPress,
    onLongPressStart: () => setProgress(100),
    onLongPressEnd: () => setTimeout(() => setProgress(0), 100),
  });

  return (
    <Tooltip title="Backspace">
      <Box sx={{ alignSelf: "center", position: "relative" }}>
        <IconButton
          {...mergeProps(pressProps, longPressProps)}
          aria-label="Backspace"
          size="large"
          color="inherit"
          disabled={disabled}
          sx={{ width: 72, height: 72 }}
        >
          <BackspaceOutlinedIcon />
        </IconButton>

        <StyledCircularProgress
          variant="determinate"
          value={progress}
          active={progress > 0}
          size={72}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      </Box>
    </Tooltip>
  );
}

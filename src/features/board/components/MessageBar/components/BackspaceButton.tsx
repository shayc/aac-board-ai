import BackspaceIcon from "@mui/icons-material/Backspace";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";
import { mergeProps, useLongPress, usePress } from "react-aria";

const RING_DELAY_MS = 200;
const RING_FILL_MS = 400;
const LONG_PRESS_THRESHOLD_MS = RING_DELAY_MS + RING_FILL_MS;

const StyledCircularProgress = styled(CircularProgress, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ active }) => ({
  "& svg circle": {
    transitionProperty: "stroke-dashoffset",
    transitionTimingFunction: "linear",
    transitionDelay: active ? `${RING_DELAY_MS}ms` : "0ms",
    transitionDuration: active ? `${RING_FILL_MS}ms` : "0ms",
  },
}));

interface BackspaceButtonProps {
  onPress: () => void;
  onLongPress: () => void;
}

export function BackspaceButton({
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
    onLongPressEnd: () => setProgress(0),
  });

  return (
    <Tooltip title="Backspace" enterDelay={800}>
      <Box sx={{ alignSelf: "center", position: "relative" }}>
        <IconButton
          {...mergeProps(pressProps, longPressProps)}
          aria-label="Backspace"
          size="large"
          color="inherit"
          sx={{ width: 64, height: 64 }}
        >
          <BackspaceIcon />
        </IconButton>

        <StyledCircularProgress
          variant="determinate"
          value={progress}
          active={progress > 0}
          size={68}
          sx={{
            position: "absolute",
            top: -2,
            left: -2,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      </Box>
    </Tooltip>
  );
}

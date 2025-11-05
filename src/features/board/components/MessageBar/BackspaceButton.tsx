import BackspaceIcon from "@mui/icons-material/Backspace";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { mergeProps, useLongPress, usePress } from "react-aria";

interface BackspaceButtonProps {
  onPress: () => void;
  onLongPress: () => void;
}

export function BackspaceButton({
  onPress,
  onLongPress,
}: BackspaceButtonProps) {
  const { pressProps } = usePress({
    onPress,
  });

  const { longPressProps } = useLongPress({
    accessibilityDescription: "Long press to clear message",
    onLongPress,
  });

  return (
    <Tooltip title="Backspace" enterDelay={800}>
      <Box sx={{ alignSelf: "center", position: "relative" }}>
        <IconButton
          {...mergeProps(pressProps, longPressProps)}
          aria-label="Backspace"
          size="large"
          color="inherit"
        >
          <BackspaceIcon />
        </IconButton>
      </Box>
    </Tooltip>
  );
}

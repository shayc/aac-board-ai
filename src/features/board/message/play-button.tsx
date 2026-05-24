import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { flipForRtl } from "@shared/theme/rtl";

export interface PlayButtonProps {
  disabled?: boolean;
  isPlaying: boolean;
  onPlayClick: () => void;
  onStopClick: () => void;
}

export function PlayButton({
  disabled,
  isPlaying,
  onPlayClick,
  onStopClick,
}: PlayButtonProps) {
  const playButtonLabel = isPlaying ? m.messageStop() : m.messagePlay();

  return (
    <Tooltip title={playButtonLabel}>
      <Box sx={{ alignSelf: "center" }}>
        <IconButton
          aria-label={playButtonLabel}
          size="large"
          disabled={disabled}
          onClick={isPlaying ? onStopClick : onPlayClick}
          sx={{
            width: 72,
            height: 72,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": {
              bgcolor: "primary.dark",
            },
          }}
        >
          {isPlaying ? <StopIcon /> : <PlayArrowIcon sx={flipForRtl} />}
        </IconButton>
      </Box>
    </Tooltip>
  );
}

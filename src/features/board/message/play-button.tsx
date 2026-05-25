import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
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
        <Fab
          color="primary"
          disabled={disabled}
          aria-label={playButtonLabel}
          onClick={isPlaying ? onStopClick : onPlayClick}
          sx={{
            width: 72,
            height: 72,
          }}
        >
          {isPlaying ? (
            <StopIcon sx={{ fontSize: 32 }} />
          ) : (
            <PlayArrowIcon sx={[flipForRtl, { fontSize: 32 }]} />
          )}
        </Fab>
      </Box>
    </Tooltip>
  );
}

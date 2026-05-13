import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
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
  const playButtonLabel = isPlaying ? "Stop playback" : "Play message";

  return (
    <Tooltip title={playButtonLabel}>
      <Box>
        <IconButton
          aria-label={playButtonLabel}
          size="large"
          disabled={disabled}
          onClick={isPlaying ? onStopClick : onPlayClick}
          sx={{
            width: 104,
            height: 104,
            backgroundColor: (theme) => theme.palette.primary.main,
            color: (theme) => theme.palette.primary.contrastText,
            "&:hover": {
              backgroundColor: (theme) => theme.palette.primary.dark,
            },
          }}
        >
          {isPlaying ? (
            <StopIcon sx={{ width: 48, height: 48 }} />
          ) : (
            <PlayArrowIcon sx={[flipForRtl, { width: 48, height: 48 }]} />
          )}
        </IconButton>
      </Box>
    </Tooltip>
  );
}

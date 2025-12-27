import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

interface PlayButtonProps {
  isPlaying: boolean;
  onPlayClick: () => void;
  onStopClick: () => void;
}

export function PlayButton({
  isPlaying,
  onPlayClick,
  onStopClick,
}: PlayButtonProps) {
  const playButtonLabel = isPlaying ? "Stop playback" : "Play message";

  return (
    <Tooltip title={playButtonLabel}>
      <Box sx={{ alignSelf: "center" }}>
        <IconButton
          aria-label={playButtonLabel}
          size="large"
          onClick={isPlaying ? onStopClick : onPlayClick}
          sx={{
            width: 80,
            height: 80,
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
            <PlayArrowIcon sx={{ width: 48, height: 48 }} />
          )}
        </IconButton>
      </Box>
    </Tooltip>
  );
}

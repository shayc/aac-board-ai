import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Fab from "@mui/material/Fab";
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
  return (
    <Fab
      aria-label={isPlaying ? m.messageStop() : m.messagePlay()}
      color={isPlaying ? "default" : "primary"}
      disabled={disabled}
      onClick={isPlaying ? onStopClick : onPlayClick}
      sx={{
        width: 72,
        height: 72,
        flexShrink: 0,
        m: 2,
        alignSelf: "center",
      }}
    >
      {isPlaying ? (
        <StopIcon sx={{ fontSize: 32 }} />
      ) : (
        <PlayArrowIcon sx={[flipForRtl, { fontSize: 32 }]} />
      )}
    </Fab>
  );
}

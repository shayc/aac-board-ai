import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Fab from "@mui/material/Fab";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

const iconSx = { fontSize: 32 };

interface PlayButtonProps {
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
  const t = useTranslate();
  const label = isPlaying ? t(m.messageStop) : t(m.messagePlay);

  return (
    <Fab
      color={isPlaying ? "default" : "primary"}
      disabled={disabled}
      aria-label={label}
      onClick={isPlaying ? onStopClick : onPlayClick}
      sx={{
        width: 72,
        height: 72,
        flexShrink: 0,
        my: 2,
        marginInlineStart: 0,
        marginInlineEnd: 2,
        alignSelf: "center",
      }}
    >
      {isPlaying ? <StopIcon sx={iconSx} /> : <PlayArrowIcon sx={iconSx} />}
    </Fab>
  );
}

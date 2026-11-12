import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Fab, { fabClasses } from "@mui/material/Fab";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";

const iconSx = { fontSize: 32 };

interface PlayButtonProps {
  disabled?: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function PlayButton({
  disabled = false,
  isPlaying,
  onPlay,
  onStop,
}: PlayButtonProps) {
  const t = useTranslate();
  const label = isPlaying ? t(m.messageStop) : t(m.messagePlay);
  const handleClick = isPlaying ? onStop : onPlay;

  return (
    <Fab
      {...focusableDisabledProps(disabled)}
      aria-label={label}
      color={isPlaying ? "default" : "primary"}
      onClick={disabled ? undefined : handleClick}
      sx={{
        alignSelf: "center",
        flexShrink: 0,
        width: 80,
        height: 80,
        my: 2,
        marginInlineEnd: 2,
        [`&, &:active, &.${fabClasses.focusVisible}`]: { boxShadow: "none" },
      }}
    >
      {isPlaying ? <StopIcon sx={iconSx} /> : <PlayArrowIcon sx={iconSx} />}
    </Fab>
  );
}

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Fab, { fabClasses } from "@mui/material/Fab";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

const iconSx = { fontSize: 32 };

interface PlayButtonProps {
  disabled?: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function PlayButton({
  disabled,
  isPlaying,
  onPlay,
  onStop,
}: PlayButtonProps) {
  const t = useTranslate();
  const label = isPlaying ? t(m.messageStop) : t(m.messagePlay);

  return (
    <Fab
      aria-label={label}
      disabled={disabled}
      color={isPlaying ? "default" : "primary"}
      onClick={isPlaying ? onStop : onPlay}
      sx={(theme) => ({
        alignSelf: "center",
        flexShrink: 0,
        width: 80,
        height: 80,
        my: 2,
        marginInlineStart: 0,
        marginInlineEnd: 2,
        // Speaking is the primary action: a soft glow in its own color.
        boxShadow: `0 6px 18px -6px ${theme.alpha((theme.vars ?? theme).palette.primary.main, 0.55)}, 0 1px 2px rgb(0 0 0 / 0.2)`,
        [`&.${fabClasses.disabled}`]: {
          boxShadow: `inset 0 0 0 1px ${(theme.vars ?? theme).palette.divider}`,
        },
      })}
    >
      {isPlaying ? <StopIcon sx={iconSx} /> : <PlayArrowIcon sx={iconSx} />}
    </Fab>
  );
}

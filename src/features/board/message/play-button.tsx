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
      sx={(theme) => ({
        alignSelf: "center",
        flexShrink: 0,
        width: 72,
        height: 72,
        my: 1,
        marginInlineEnd: 1,
        [`&, &:active, &.${fabClasses.focusVisible}`]: { boxShadow: "none" },
        // A tint of the play color reads as "not yet" in an empty bar; MUI's
        // solid grey would be the heaviest shape on screen.
        [`&.${fabClasses.disabled}`]: {
          color: theme.alpha(
            theme.vars.palette.primary.main,
            theme.vars.palette.action.disabledOpacity,
          ),
          backgroundColor: theme.alpha(
            theme.vars.palette.primary.main,
            theme.vars.palette.action.activatedOpacity,
          ),
        },
      })}
    >
      {isPlaying ? <StopIcon sx={iconSx} /> : <PlayArrowIcon sx={iconSx} />}
    </Fab>
  );
}

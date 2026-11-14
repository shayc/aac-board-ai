import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Button, { buttonClasses } from "@mui/material/Button";
import Fab, { fabClasses } from "@mui/material/Fab";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";

export const PLAY_BUTTON_SIZE = 80;

const largeIconSx = { fontSize: 36 };

interface PlayButtonProps {
  disabled?: boolean;
  isPlaying: boolean;
  /** Matches the board's back and home buttons instead of standing out. */
  isCompact?: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function PlayButton({
  disabled = false,
  isPlaying,
  isCompact = false,
  onPlay,
  onStop,
}: PlayButtonProps) {
  const t = useTranslate();
  const label = isPlaying ? t(m.messageStop) : t(m.messagePlay);
  const toggle = isPlaying ? onStop : onPlay;
  const handleClick = disabled ? undefined : toggle;
  const Icon = isPlaying ? StopIcon : PlayArrowIcon;

  if (isCompact) {
    return (
      <Button
        {...focusableDisabledProps(disabled)}
        aria-label={label}
        size="large"
        color={isPlaying ? "inherit" : "primary"}
        variant="contained"
        onClick={handleClick}
        sx={(theme) => ({
          width: 72,
          [`&.${buttonClasses.disabled}`]: disabledSx(theme),
        })}
      >
        <Icon />
      </Button>
    );
  }

  return (
    <Fab
      {...focusableDisabledProps(disabled)}
      aria-label={label}
      color={isPlaying ? "default" : "primary"}
      onClick={handleClick}
      sx={(theme) => ({
        alignSelf: "center",
        flexShrink: 0,
        width: PLAY_BUTTON_SIZE,
        height: PLAY_BUTTON_SIZE,
        [`&, &:active, &.${fabClasses.focusVisible}`]: { boxShadow: "none" },
        [`&.${fabClasses.disabled}`]: disabledSx(theme),
      })}
    >
      <Icon sx={largeIconSx} />
    </Fab>
  );
}

// A tint of the play color reads as "not yet" in an empty message; MUI's solid
// grey would be the heaviest shape on screen.
function disabledSx(theme: Theme) {
  return {
    color: theme.alpha(
      theme.vars.palette.primary.main,
      theme.vars.palette.action.disabledOpacity,
    ),
    backgroundColor: theme.alpha(
      theme.vars.palette.primary.main,
      theme.vars.palette.action.activatedOpacity,
    ),
  };
}

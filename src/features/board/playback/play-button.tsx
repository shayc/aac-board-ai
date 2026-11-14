import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { buttonClasses } from "@mui/material/Button";
import Fab, { fabClasses } from "@mui/material/Fab";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { BoardControlButton } from "../board-control-button";
import {
  MESSAGE_ACTION_ICON_SIZE,
  MESSAGE_ACTION_SIZE,
} from "../message/message-bar";

interface PlayButtonProps {
  disabled?: boolean;
  isPlaying: boolean;
  variant?: "prominent" | "control";
  onPlay: () => void;
  onStop: () => void;
}

export function PlayButton({
  disabled = false,
  isPlaying,
  variant = "prominent",
  onPlay,
  onStop,
}: PlayButtonProps) {
  const t = useTranslate();
  const label = isPlaying ? t(m.messageStop) : t(m.messagePlay);
  const handleClick = isPlaying ? onStop : onPlay;
  const Icon = isPlaying ? StopIcon : PlayArrowIcon;

  if (variant === "control") {
    return (
      <BoardControlButton
        aria-label={label}
        disabled={disabled}
        color={isPlaying ? "inherit" : "primary"}
        onClick={handleClick}
        sx={(theme) => ({
          [`&.${buttonClasses.disabled}`]: disabledSx(theme),
        })}
      >
        <Icon />
      </BoardControlButton>
    );
  }

  return (
    <Fab
      {...focusableDisabledProps(disabled)}
      aria-label={label}
      color={isPlaying ? "default" : "primary"}
      onClick={disabled ? undefined : handleClick}
      sx={(theme) => ({
        flexShrink: 0,
        width: MESSAGE_ACTION_SIZE,
        height: MESSAGE_ACTION_SIZE,
        [`&, &:active, &.${fabClasses.focusVisible}`]: { boxShadow: "none" },
        [`&.${fabClasses.disabled}`]: disabledSx(theme),
      })}
    >
      <Icon sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE }} />
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

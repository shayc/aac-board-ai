import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { buttonClasses } from "@mui/material/Button";
import Fab, { fabClasses } from "@mui/material/Fab";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { ShortcutTooltip } from "@shared/ui/shortcut-tooltip";
import { BoardControlButton } from "../board-control-button";
import {
  MESSAGE_ACTION_ICON_SIZE,
  MESSAGE_ACTION_SIZE,
  MESSAGE_ACTION_SIZE_PROPERTY,
} from "../message/message-bar";
import { BOARD_SHORTCUT_ARIA_KEYS } from "../shortcuts/resolve-board-shortcut";
import type { BoardShortcutLabels } from "../shortcuts/use-board-shortcut-labels";

interface PlayButtonProps {
  disabled?: boolean;
  isPlaying: boolean;
  variant?: "prominent" | "boardControl";
  shortcutLabels: Pick<BoardShortcutLabels, "play" | "stop">;
  onPlay: () => void;
  onStop: () => void;
}

export function PlayButton({
  disabled = false,
  isPlaying,
  variant = "prominent",
  shortcutLabels,
  onPlay,
  onStop,
}: PlayButtonProps) {
  const t = useTranslate();
  const label = isPlaying ? t(m.messageStop) : t(m.messagePlay);
  const shortcut = isPlaying ? "stop" : "play";
  const shortcutKeys = shortcutLabels[shortcut];
  const ariaKeyShortcuts = BOARD_SHORTCUT_ARIA_KEYS[shortcut];
  const handleClick = isPlaying ? onStop : onPlay;
  const Icon = isPlaying ? StopIcon : PlayArrowIcon;

  if (variant === "boardControl") {
    return (
      <ShortcutTooltip action={label} keys={shortcutKeys}>
        <BoardControlButton
          aria-label={label}
          aria-keyshortcuts={ariaKeyShortcuts}
          disabled={disabled}
          color="primary"
          onClick={handleClick}
          sx={(theme) => ({
            [`&.${buttonClasses.disabled}`]: disabledSx(theme),
          })}
        >
          <Icon />
        </BoardControlButton>
      </ShortcutTooltip>
    );
  }

  return (
    <ShortcutTooltip action={label} keys={shortcutKeys}>
      <Fab
        {...focusableDisabledProps(disabled)}
        aria-label={label}
        aria-keyshortcuts={ariaKeyShortcuts}
        color="primary"
        onClick={disabled ? undefined : handleClick}
        sx={(theme) => ({
          flexShrink: 0,
          width: `var(${MESSAGE_ACTION_SIZE_PROPERTY}, ${MESSAGE_ACTION_SIZE}px)`,
          height: `var(${MESSAGE_ACTION_SIZE_PROPERTY}, ${MESSAGE_ACTION_SIZE}px)`,
          [`&, &:active, &.${fabClasses.focusVisible}`]: { boxShadow: "none" },
          [`&.${fabClasses.disabled}`]: {
            ...disabledSx(theme),
            ...theme.applyStyles("dark", disabledOnDarkBarSx(theme)),
          },
        })}
      >
        <Icon sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE }} />
      </Fab>
    </ShortcutTooltip>
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

// The usual tint turns grey on the bar's grey dark-mode ground and is lost
// beside backspace; the lighter teal keeps its hue.
function disabledOnDarkBarSx(theme: Theme) {
  return {
    color: theme.alpha(theme.vars.palette.primary.main, 0.6),
    backgroundColor: theme.alpha(
      theme.vars.palette.primary.light,
      theme.vars.palette.action.disabledOpacity,
    ),
  };
}

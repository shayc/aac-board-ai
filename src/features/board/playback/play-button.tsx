import { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { PlayArrowFilledIcon, StopFilledIcon } from "@shared/ui/icons";
import { ShortcutTooltip } from "@shared/ui/shortcut-tooltip";
import {
  BoardControlButton,
  type BoardControlShape,
} from "../board-control-button";
import { BOARD_ARIA_KEY_SHORTCUTS } from "../shortcuts/resolve-board-shortcut";
import type { BoardShortcutKeys } from "../shortcuts/use-board-shortcut-keys";

interface PlayButtonProps {
  disabled?: boolean;
  isPlaying: boolean;
  shape?: BoardControlShape;
  shortcutKeys: Pick<BoardShortcutKeys, "play" | "stop">;
  onPlay: () => void;
  onStop: () => void;
}

export function PlayButton({
  disabled = false,
  isPlaying,
  shape = "round",
  shortcutKeys,
  onPlay,
  onStop,
}: PlayButtonProps) {
  const t = useTranslate();
  const label = isPlaying ? t(m.messageStop) : t(m.messagePlay);
  const shortcut = isPlaying ? "stop" : "play";
  const keys = shortcutKeys[shortcut];
  const ariaKeyShortcuts = BOARD_ARIA_KEY_SHORTCUTS[shortcut];
  const handleClick = isPlaying ? onStop : onPlay;
  const Icon = isPlaying ? StopFilledIcon : PlayArrowFilledIcon;

  const isInBar = shape === "round";

  return (
    <ShortcutTooltip action={label} keys={keys}>
      <BoardControlButton
        aria-label={label}
        aria-keyshortcuts={ariaKeyShortcuts}
        disabled={disabled}
        color="primary"
        shape={shape}
        disableElevation={isInBar}
        onClick={handleClick}
        sx={(theme) => ({
          flexShrink: 0,
          [`&.${buttonClasses.disabled}`]: {
            ...disabledSx(theme),
            ...(isInBar &&
              theme.applyStyles("dark", disabledOnDarkBarSx(theme))),
          },
        })}
      >
        <Icon />
      </BoardControlButton>
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

// The bar's dark-mode grey mutes the tint, so play needs more contrast here.
function disabledOnDarkBarSx(theme: Theme) {
  return { color: theme.alpha(theme.vars.palette.primary.main, 0.6) };
}

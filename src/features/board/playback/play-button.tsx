import { buttonClasses } from "@mui/material/Button";
import Fab, { fabClasses } from "@mui/material/Fab";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { PlayArrowFilledIcon, StopFilledIcon } from "@shared/ui/icons";
import { ShortcutTooltip } from "@shared/ui/shortcut-tooltip";
import {
  BoardControlButton,
  type BoardControlShape,
} from "../board-control-button";
import {
  CONTROL_ICON_SIZE,
  MESSAGE_CONTROL_SIZE,
} from "../board-control-sizes";
import { BOARD_SHORTCUT_ARIA_KEYS } from "../shortcuts/resolve-board-shortcut";
import type { BoardShortcutLabels } from "../shortcuts/use-board-shortcut-labels";

interface PlayButtonProps {
  disabled?: boolean;
  isPlaying: boolean;
  shape?: BoardControlShape;
  shortcutLabels: Pick<BoardShortcutLabels, "play" | "stop">;
  onPlay: () => void;
  onStop: () => void;
}

export function PlayButton({
  disabled = false,
  isPlaying,
  shape = "round",
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
  const Icon = isPlaying ? StopFilledIcon : PlayArrowFilledIcon;

  if (shape === "pill") {
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
          width: MESSAGE_CONTROL_SIZE,
          height: MESSAGE_CONTROL_SIZE,
          [`&, &:active, &.${fabClasses.focusVisible}`]: { boxShadow: "none" },
          [`&.${fabClasses.disabled}`]: {
            ...disabledSx(theme),
            ...theme.applyStyles("dark", disabledOnDarkBarSx(theme)),
          },
        })}
      >
        <Icon sx={{ fontSize: CONTROL_ICON_SIZE }} />
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

// The bar's dark-mode grey mutes the tint, so play needs more contrast here.
function disabledOnDarkBarSx(theme: Theme) {
  return { color: theme.alpha(theme.vars.palette.primary.main, 0.6) };
}

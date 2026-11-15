import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { ReactElement } from "react";

// Key symbols such as ⌘ and ⌫ have no direction of their own, so a
// right-to-left interface would reverse them without a left-to-right isolate.
const LEFT_TO_RIGHT_ISOLATE = "\u2066";
const POP_DIRECTIONAL_ISOLATE = "\u2069";

interface ShortcutTooltipProps {
  action: string;
  shortcut: string;
  children: ReactElement;
}

/**
 * Shows a board control's keyboard shortcut while the control has keyboard
 * focus. Head-pointer and eye-gaze users rest on targets to select them, so
 * hover would cover the board, and touch has no keys to learn.
 */
export function ShortcutTooltip({
  action,
  shortcut,
  children,
}: ShortcutTooltipProps) {
  const t = useTranslate();
  const isolatedShortcut = `${LEFT_TO_RIGHT_ISOLATE}${shortcut}${POP_DIRECTIONAL_ISOLATE}`;

  return (
    <Tooltip
      // A string title keeps the control's own name; an element title would
      // make MUI label the control by the tooltip while it is open.
      title={t(m.shortcutTooltip, { action, shortcut: isolatedShortcut })}
      placement="top"
      disableHoverListener
      disableTouchListener
    >
      {children}
    </Tooltip>
  );
}

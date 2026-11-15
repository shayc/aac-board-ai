import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { ReactElement } from "react";

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

  return (
    <Tooltip
      title={t(m.shortcutTooltip, { action, shortcut })}
      placement="top"
      disableHoverListener
      disableTouchListener
    >
      {children}
    </Tooltip>
  );
}

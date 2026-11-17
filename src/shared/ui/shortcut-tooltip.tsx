import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { ReactElement } from "react";

// Isolate direction-neutral key symbols (e.g. ⌘⌫) so RTL interfaces don't reverse them.
const LEFT_TO_RIGHT_ISOLATE = "\u2066";
const POP_DIRECTIONAL_ISOLATE = "\u2069";

interface ShortcutTooltipProps {
  action: string;
  keys: string;
  children: ReactElement;
}

/**
 * Shows shortcuts on keyboard focus only: hover tooltips block
 * head-pointer/eye-gaze dwell targets, and touch has no keys.
 */
export function ShortcutTooltip({
  action,
  keys,
  children,
}: ShortcutTooltipProps) {
  const t = useTranslate();
  const isolatedKeys = `${LEFT_TO_RIGHT_ISOLATE}${keys}${POP_DIRECTIONAL_ISOLATE}`;

  return (
    <Tooltip
      // Keep `title` a string so MUI doesn't override the control's accessible name.
      title={t(m.shortcutTooltip, { action, shortcut: isolatedKeys })}
      placement="top"
      disableHoverListener
      disableTouchListener
    >
      {children}
    </Tooltip>
  );
}

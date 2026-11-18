import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { isolateLTR } from "@shared/language/bidi-isolate";
import { useTranslate } from "@shared/language/use-translate";
import type { ReactElement } from "react";

interface ShortcutTooltipProps {
  action: string;
  keys: string;
  children: ReactElement;
}

/**
 * Shows a control's keyboard shortcut while the control has keyboard focus.
 * Head-pointer and eye-gaze users rest on targets to select them, so hover
 * would cover what they aim at, and touch has no keys to learn.
 */
export function ShortcutTooltip({
  action,
  keys,
  children,
}: ShortcutTooltipProps) {
  const t = useTranslate();

  return (
    <Tooltip
      // A string title keeps the control's own name; an element title would
      // make MUI label the control by the tooltip while it is open.
      title={t(m.shortcutTooltip, { action, shortcut: isolateLTR(keys) })}
      placement="top"
      disableHoverListener
      disableTouchListener
    >
      {children}
    </Tooltip>
  );
}

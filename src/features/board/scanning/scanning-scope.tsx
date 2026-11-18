import Box from "@mui/material/Box";
import { buttonBaseClasses } from "@mui/material/ButtonBase";
import type { Theme } from "@mui/material/styles";
import { type ReactNode, useRef } from "react";
import {
  SCAN_HIGHLIGHT_SELECTOR,
  SCAN_HIGHLIGHTED_GROUP_SELECTOR,
} from "./scan-targets";
import { useScanningPreferences } from "./scanning-preferences-store";
import { SwitchScanner } from "./switch-scanner";

/** Set on a scan group whose controls are rounder than a tile, to round its highlight alike. */
export const SCAN_GROUP_RADIUS_PROPERTY = "--scan-group-radius";

interface ScanningScopeProps {
  children: ReactNode;
}

export function ScanningScope({ children }: ScanningScopeProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const { isEnabled, method, intervalMs } = useScanningPreferences();

  return (
    <Box ref={scopeRef} sx={scopeSx}>
      {isEnabled && (
        <SwitchScanner
          key={method}
          scopeRef={scopeRef}
          method={method}
          intervalMs={intervalMs}
        />
      )}

      {children}
    </Box>
  );
}

function scopeSx(theme: Theme) {
  return {
    display: "contents",
    // Doubled so the highlight also wins on a control that has keyboard focus.
    [`&& ${SCAN_HIGHLIGHT_SELECTOR}`]: {
      outline: `4px solid ${theme.vars.palette.primary.main}`,
      outlineOffset: 2,
    },
    // The outline follows the radius, so a group's corners match its controls'.
    [`& ${SCAN_HIGHLIGHTED_GROUP_SELECTOR}`]: {
      borderRadius: `var(${SCAN_GROUP_RADIUS_PROPERTY}, ${theme.vars.shape.borderRadius})`,
    },
    // Two outlined controls would leave it unclear which one a switch selects.
    [`&:has(${SCAN_HIGHLIGHT_SELECTOR}) :is(.${buttonBaseClasses.focusVisible}, :focus-visible):not(${SCAN_HIGHLIGHT_SELECTOR})`]:
      {
        outline: "none",
      },
  };
}

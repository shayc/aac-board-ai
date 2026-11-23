import Box from "@mui/material/Box";
import { buttonBaseClasses } from "@mui/material/ButtonBase";
import type { Theme } from "@mui/material/styles";
import { type ReactNode, useRef } from "react";
import {
  SCAN_HIGHLIGHTED_ITEM_SELECTOR,
  SCAN_HIGHLIGHTED_ROW_SELECTOR,
  SCAN_OUTLINE_OFFSET_PX,
  SCAN_OUTLINE_WIDTH_PX,
} from "./scan-targets";
import { useScanningPreferences } from "./scanning-preferences-store";
import { SwitchScanner } from "./switch-scanner";

// A highlighted row is outlined once, in place of each button inside it.
const OUTLINED_SELECTOR = `:is(${SCAN_HIGHLIGHTED_ROW_SELECTOR}, ${SCAN_HIGHLIGHTED_ITEM_SELECTOR}:not(${SCAN_HIGHLIGHTED_ROW_SELECTOR} *))`;

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
    [`&& ${OUTLINED_SELECTOR}`]: {
      outline: `${SCAN_OUTLINE_WIDTH_PX}px solid ${theme.vars.palette.primary.main}`,
      outlineOffset: SCAN_OUTLINE_OFFSET_PX,
    },
    [`& ${SCAN_HIGHLIGHTED_ROW_SELECTOR}`]: {
      borderRadius: theme.vars.shape.borderRadiusSm,
    },
    // Two outlined controls would leave it unclear which one a switch selects.
    [`&:has(${OUTLINED_SELECTOR}) :is(.${buttonBaseClasses.focusVisible}, :focus-visible):not(${OUTLINED_SELECTOR})`]:
      {
        outline: "none",
      },
  };
}

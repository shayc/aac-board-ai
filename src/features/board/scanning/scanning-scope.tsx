import Box from "@mui/material/Box";
import { buttonBaseClasses } from "@mui/material/ButtonBase";
import type { Theme } from "@mui/material/styles";
import { useRef, type ReactNode } from "react";
import { SCAN_HIGHLIGHTED_ITEM_SELECTOR } from "./scan-targets";
import { useScanningPreferences } from "./scanning-preferences-store";
import { SwitchScanner } from "./switch-scanner";

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
    [`&& ${SCAN_HIGHLIGHTED_ITEM_SELECTOR}`]: {
      outline: `4px solid ${theme.vars.palette.primary.main}`,
      outlineOffset: 2,
    },
    // Two outlined controls would leave it unclear which one a switch selects.
    [`&:has(${SCAN_HIGHLIGHTED_ITEM_SELECTOR}) .${buttonBaseClasses.focusVisible}:not(${SCAN_HIGHLIGHTED_ITEM_SELECTOR})`]:
      {
        outline: "none",
      },
  };
}

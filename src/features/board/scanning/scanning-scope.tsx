import Box from "@mui/material/Box";
import type { Theme } from "@mui/material/styles";
import { useRef, type ReactNode } from "react";
import { SCAN_HIGHLIGHT_SELECTOR } from "./scan-targets";
import { useScanningPreferences } from "./scanning-preferences-store";
import { SwitchScanner } from "./switch-scanner";

function scopeSx(theme: Theme) {
  return {
    display: "contents",
    [`& ${SCAN_HIGHLIGHT_SELECTOR}`]: {
      outline: `4px solid ${theme.vars.palette.primary.main}`,
      outlineOffset: 2,
    },
  };
}

interface ScanningScopeProps {
  children: ReactNode;
}

/** Makes the scan groups among its children reachable by switch scanning. */
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

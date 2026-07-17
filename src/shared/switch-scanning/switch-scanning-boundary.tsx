import "@shayc/switch-scanning/styles.css";

import { SwitchScanner } from "@shayc/switch-scanning/react";
import type { ReactNode } from "react";
import {
  createKeyboardBindings,
  createScanMethod,
} from "./switch-scanning-options";
import { useSwitchScanningConfig } from "./switch-scanning-store";

export interface SwitchScanningBoundaryProps {
  children: ReactNode;
}

function shouldHandleBoardInput(event: KeyboardEvent): boolean {
  const target = event.target;

  if (target === document.body) {
    return true;
  }

  return (
    target instanceof Element &&
    target.closest("[data-switch-scanning-scope]") !== null
  );
}

export function SwitchScanningBoundary({
  children,
}: SwitchScanningBoundaryProps) {
  const config = useSwitchScanningConfig();
  const method = createScanMethod(config);
  const keyboard = createKeyboardBindings(config.method);

  return (
    <SwitchScanner
      method={method}
      keyboard={keyboard}
      enabled={config.enabled}
      start="input"
      behavior={{ afterActivation: "continue" }}
      keyboardOptions={{ shouldHandle: shouldHandleBoardInput }}
    >
      {children}
    </SwitchScanner>
  );
}

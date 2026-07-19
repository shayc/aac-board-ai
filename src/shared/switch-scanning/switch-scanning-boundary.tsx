import {
  ScannerProvider,
  useKeyboardSwitches,
  useOwnedScanner,
} from "@shayc/switch-scanning/react/advanced";
import type { ReactNode } from "react";
import {
  createKeyboardBindings,
  createMouseBindings,
  createScanMethod,
  createSwitchDefinitions,
} from "./switch-scanning-options";
import { useSwitchScanningConfig } from "./switch-scanning-store";
import { useMouseSwitches } from "./use-mouse-switches";

export interface SwitchScanningBoundaryProps {
  children: ReactNode;
}

function shouldHandleBoardInput(event: Event): boolean {
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
  const scanner = useOwnedScanner({
    method: createScanMethod(config),
    switches: createSwitchDefinitions(config),
    enabled: config.enabled,
    startOn: "input",
    afterActivation: "continue",
  });
  const keyboardBindings = createKeyboardBindings(config);
  const mouseBindings = createMouseBindings(config);

  useKeyboardSwitches(scanner, keyboardBindings, {
    enabled: config.enabled,
    shouldHandle: shouldHandleBoardInput,
  });
  useMouseSwitches(scanner, mouseBindings, {
    enabled: config.enabled,
    shouldHandle: shouldHandleBoardInput,
  });

  return <ScannerProvider scanner={scanner}>{children}</ScannerProvider>;
}

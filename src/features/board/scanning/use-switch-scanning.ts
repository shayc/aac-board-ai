import { useEffect, useRef, type RefObject } from "react";
import { useScanningPreferences } from "./scanning-preferences-store";
import { startSwitchScanner, type SwitchScanner } from "./switch-scanner";

/**
 * Runs switch scanning over the scan groups under `rootRef` while the
 * preference is on. A change of board returns a running scan to the first
 * group, because the highlighted tile is gone.
 */
export function useSwitchScanning(
  rootRef: RefObject<HTMLElement | null>,
  boardId: string,
): void {
  const preferences = useScanningPreferences();
  const scannerRef = useRef<SwitchScanner>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!preferences.isEnabled || !root) {
      return;
    }

    const scanner = startSwitchScanner(root, preferences);
    scannerRef.current = scanner;

    return () => {
      scanner.stop();
      scannerRef.current = null;
    };
  }, [preferences, rootRef]);

  useEffect(() => {
    scannerRef.current?.restart();
  }, [boardId]);
}

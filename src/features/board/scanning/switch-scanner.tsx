import { useEffect, useEffectEvent, useState, type RefObject } from "react";
import { flushSync } from "react-dom";
import {
  advanceScan,
  selectScan,
  startScan,
  type ScanPosition,
} from "./scan-sequence";
import {
  highlightScanTarget,
  isScanningScopeCovered,
  listScanGroups,
} from "./scan-targets";
import type { ScanMethod } from "./scanning-preferences-store";
import { useSwitchKeys } from "./use-switch-keys";

type ScanAction = "advance" | "select";

const SWITCH_KEY_ACTIONS: Record<
  ScanMethod,
  ReadonlyMap<string, ScanAction>
> = {
  auto: new Map([
    [" ", "select"],
    ["Enter", "select"],
  ]),
  step: new Map([
    [" ", "advance"],
    ["Enter", "select"],
  ]),
};

const MAX_PASSES: Record<ScanMethod, number> = {
  auto: 2,
  step: Infinity,
};

interface SwitchScannerProps {
  scopeRef: RefObject<HTMLElement | null>;
  method: ScanMethod;
  intervalMs: number;
}

export function SwitchScanner({
  scopeRef,
  method,
  intervalMs,
}: SwitchScannerProps) {
  const [position, setPosition] = useState<ScanPosition<HTMLElement> | null>(
    null,
  );

  function performAction(action: ScanAction) {
    const scope = scopeRef.current;
    if (!scope) {
      return;
    }

    if (isScanningScopeCovered(scope)) {
      setPosition(null);

      return;
    }

    const groups = listScanGroups(scope);
    if (action === "advance") {
      setPosition(advanceScan(groups, position, MAX_PASSES[method]));

      return;
    }

    const outcome = selectScan(groups, position);
    if (outcome.kind === "moved") {
      setPosition(outcome.position);

      return;
    }

    // Commit activation before reading the newly enabled scan targets.
    flushSync(() => outcome.target.click());
    setPosition(startScan(listScanGroups(scope)));
  }

  useSwitchKeys(scopeRef, SWITCH_KEY_ACTIONS[method], performAction);

  const handleInterval = useEffectEvent(() => performAction("advance"));

  useEffect(() => {
    if (method !== "auto" || !position) {
      return;
    }

    const timeoutId = setTimeout(handleInterval, intervalMs);

    return () => clearTimeout(timeoutId);
  }, [method, position, intervalMs]);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || !position) {
      return;
    }

    const target =
      position.level === "items" ? position.item : position.container;
    const removeHighlight = highlightScanTarget(target);

    const observer = new MutationObserver(() => {
      if (!target.isConnected) {
        setPosition(startScan(listScanGroups(scope)));
      }
    });
    observer.observe(scope, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      removeHighlight();
    };
  }, [scopeRef, position]);

  return null;
}

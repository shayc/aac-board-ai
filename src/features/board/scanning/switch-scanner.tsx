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
  isScanScopeCovered,
  readScanGroups,
} from "./scan-targets";
import type { ScanMethod } from "./scanning-preferences-store";
import { useSwitchKeys } from "./use-switch-keys";

type ScanAction = "step" | "select";

const SWITCH_KEYS: Record<ScanMethod, ReadonlyMap<string, ScanAction>> = {
  auto: new Map([
    [" ", "select"],
    ["Enter", "select"],
  ]),
  step: new Map([
    [" ", "step"],
    ["Enter", "select"],
  ]),
};

// An automatic scan stops moving while nobody is selecting: it pauses after
// this many passes over the groups, and moves on from a group after as many
// over its items. A step scan only moves on a press, so it keeps going around.
const MAX_PASSES: Record<ScanMethod, number> = {
  auto: 2,
  step: Infinity,
};

interface SwitchScannerProps {
  scopeRef: RefObject<HTMLElement | null>;
  method: ScanMethod;
  intervalMs: number;
}

/**
 * Scans the scan groups inside the scope. Renders nothing: it highlights the
 * current targets in place and clicks the selected one, so scanned controls
 * need no scanning code of their own.
 */
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

    // Nobody can follow a scan under a dialog or drawer, so it pauses there.
    if (isScanScopeCovered(scope)) {
      setPosition(null);

      return;
    }

    const groups = readScanGroups(scope);
    if (action === "step") {
      setPosition(advanceScan(groups, position, MAX_PASSES[method]));

      return;
    }

    const selection = selectScan(groups, position);
    if (selection.kind === "moved") {
      setPosition(selection.position);

      return;
    }

    // Flushed so the restart reads the groups the activation leaves behind,
    // such as a play button the first message part has just enabled.
    flushSync(() => selection.target.click());
    setPosition(startScan(readScanGroups(scope)));
  }

  useSwitchKeys(scopeRef, SWITCH_KEYS[method], performAction);

  const handleInterval = useEffectEvent(() => performAction("step"));

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

    const target = position.level === "items" ? position.item : position.group;
    const removeHighlight = highlightScanTarget(target);

    // The board can remove the highlighted control or group at any time, such
    // as when another board has fewer rows. Restarting shows the scan again
    // from the first group, with a full interval.
    const observer = new MutationObserver(() => {
      if (!target.isConnected) {
        setPosition(startScan(readScanGroups(scope)));
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

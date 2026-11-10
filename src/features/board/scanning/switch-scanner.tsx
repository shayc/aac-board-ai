import { useEffect, useEffectEvent, useState, type RefObject } from "react";
import { flushSync } from "react-dom";
import {
  advanceScan,
  selectScan,
  startScan,
  type ScanPosition,
} from "./scan-sequence";
import {
  highlightScanTargets,
  listScanItems,
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

// An automatic scan pauses so the highlight doesn't keep moving while nobody
// is selecting; the next switch press starts it again.
const MAX_GROUP_PASSES: Record<ScanMethod, number> = {
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

    const groups = readScanGroups(scope);
    if (action === "step") {
      setPosition(advanceScan(groups, position, MAX_GROUP_PASSES[method]));

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
    if (!position) {
      return;
    }

    return highlightScanTargets(
      position.item ? [position.item] : listScanItems(position.group),
    );
  }, [position]);

  return null;
}

import type { ScanSelection, ScanState } from "./scan-model";
import { PAUSED_SCAN } from "./scan-model";
import type { ScanPattern } from "./scanning-preferences-store";

export const SCAN_GROUP_ATTRIBUTE = "data-scan-group";

/**
 * Marks an element as a scan group. Its enabled, visible buttons are the
 * group's targets, in DOM order.
 */
export const scanGroupProps = { [SCAN_GROUP_ATTRIBUTE]: "" } as const;

export interface ScanGroup {
  /** What to highlight for the whole group: the target itself when alone. */
  element: HTMLElement;
  targets: readonly HTMLElement[];
}

/**
 * Reads the scan groups under `root` in DOM order. Groups without a target
 * are left out, so every returned group has at least one.
 */
export function findScanGroups(
  root: HTMLElement,
  pattern: ScanPattern,
): ScanGroup[] {
  const groupElements = root.querySelectorAll<HTMLElement>(
    `[${SCAN_GROUP_ATTRIBUTE}]`,
  );

  return Array.from(groupElements).flatMap((element) => {
    const targets = findScanTargets(element);
    if (pattern === "linear" || targets.length === 1) {
      return targets.map((target) => ({ element: target, targets: [target] }));
    }

    return targets.length > 0 ? [{ element, targets }] : [];
  });
}

function findScanTargets(group: HTMLElement): HTMLElement[] {
  const selector = "button:not(:disabled)";
  const descendants = Array.from(group.querySelectorAll<HTMLElement>(selector));
  const buttons = group.matches(selector)
    ? [group, ...descendants]
    : descendants;

  // A button nobody can see must not be selectable.
  return buttons.filter((button) =>
    button.checkVisibility({ visibilityProperty: true }),
  );
}

export function findHighlightedElement(
  state: ScanState,
  groups: readonly ScanGroup[],
): HTMLElement | undefined {
  if (state.status === "paused") {
    return undefined;
  }

  const group = groups[state.groupIndex];
  if (state.status === "groups") {
    return group?.element;
  }

  return group?.targets[state.itemIndex] ?? group?.element;
}

export function findSelectedTarget(
  selection: ScanSelection,
  groups: readonly ScanGroup[],
): HTMLElement | undefined {
  return groups[selection.groupIndex]?.targets[selection.itemIndex];
}

/**
 * Moves a scan state onto freshly read groups by finding the element it
 * highlights. The DOM can change between steps (a button becomes disabled, a
 * tile appears), which shifts indexes; following the element keeps what is
 * selected equal to what is highlighted. Returns a paused scan when the
 * element is gone, so the next event restarts at the first group.
 */
export function relocateScanState(
  state: ScanState,
  highlighted: HTMLElement | undefined,
  groups: readonly ScanGroup[],
): ScanState {
  if (state.status === "paused" || !highlighted) {
    return PAUSED_SCAN;
  }

  const { pass } = state;

  if (state.status === "groups") {
    const groupIndex = groups.findIndex(
      (group) => group.element === highlighted,
    );

    return groupIndex === -1
      ? PAUSED_SCAN
      : { status: "groups", groupIndex, pass };
  }

  for (const [groupIndex, group] of groups.entries()) {
    if (group.targets.length === 1) {
      continue;
    }

    if (group.element === highlighted) {
      const itemIndex = group.targets.length;

      return { status: "items", groupIndex, itemIndex, pass };
    }

    const itemIndex = group.targets.indexOf(highlighted);
    if (itemIndex !== -1) {
      return { status: "items", groupIndex, itemIndex, pass };
    }
  }

  return PAUSED_SCAN;
}

/**
 * Two-level scanning. The scan moves through groups; selecting a group moves
 * through its items; selecting an item activates it. A group with one item
 * activates that item directly.
 *
 * After a group's last item the whole group is highlighted once more as an
 * exit step: selecting it returns to the groups, which is how a wrongly
 * selected group is left.
 *
 * Positions hold targets rather than indexes, so the groups may change between
 * steps: a position whose target is gone restarts the scan.
 */

export interface ScanGroup<Target> {
  container: Target;
  items: readonly [Target, ...Target[]];
}

interface LevelPosition<Target> {
  container: Target;
  /** Passes over the current level that ended without a selection. */
  completedPasses: number;
}

export type ScanPosition<Target> =
  | (LevelPosition<Target> & { level: "groups" })
  | (LevelPosition<Target> & { level: "items"; item: Target })
  | (LevelPosition<Target> & { level: "exit" });

export type ScanSelection<Target> =
  | { kind: "moved"; position: ScanPosition<Target> | null }
  | { kind: "activated"; target: Target };

export function startScan<Target>(
  groups: readonly ScanGroup<Target>[],
): ScanPosition<Target> | null {
  const firstGroup = groups[0];

  return firstGroup ? groupPosition(firstGroup, 0) : null;
}

/**
 * Moves to the next group, item, or exit step. `maxPasses` passes over a level
 * without a selection end it: the groups return `null`, a paused scan, and a
 * group's items move on to the next group.
 */
export function advanceScan<Target>(
  groups: readonly ScanGroup<Target>[],
  position: ScanPosition<Target> | null,
  maxPasses: number,
): ScanPosition<Target> | null {
  const groupIndex = findGroupIndex(groups, position);
  const group = groups[groupIndex];
  if (!position || !group) {
    return startScan(groups);
  }

  if (position.level === "groups") {
    return nextGroupPosition(
      groups,
      groupIndex,
      position.completedPasses,
      maxPasses,
    );
  }

  if (position.level === "items") {
    return nextItemPosition(group, position.item, position.completedPasses);
  }

  const completedPasses = position.completedPasses + 1;
  if (completedPasses < maxPasses) {
    return itemPosition(group, group.items[0], completedPasses);
  }

  // The exit step has just shown the whole group, so the scan moves on from it.
  return nextGroupPosition(groups, groupIndex, 0, maxPasses);
}

export function selectScan<Target>(
  groups: readonly ScanGroup<Target>[],
  position: ScanPosition<Target> | null,
): ScanSelection<Target> {
  const group = groups[findGroupIndex(groups, position)];
  if (!position || !group) {
    return { kind: "moved", position: startScan(groups) };
  }

  if (position.level === "exit") {
    return { kind: "moved", position: groupPosition(group, 0) };
  }

  const firstItem = group.items[0];
  if (position.level === "groups" && group.items.length === 1) {
    return { kind: "activated", target: firstItem };
  }

  if (position.level === "items" && group.items.includes(position.item)) {
    return { kind: "activated", target: position.item };
  }

  return { kind: "moved", position: itemPosition(group, firstItem, 0) };
}

function nextGroupPosition<Target>(
  groups: readonly ScanGroup<Target>[],
  groupIndex: number,
  previousPasses: number,
  maxPasses: number,
): ScanPosition<Target> | null {
  const nextIndex = (groupIndex + 1) % groups.length;
  const hasCompletedPass = nextIndex === 0;
  const completedPasses = previousPasses + (hasCompletedPass ? 1 : 0);

  const nextGroup = groups[nextIndex];
  if (!nextGroup || completedPasses >= maxPasses) {
    return null;
  }

  return groupPosition(nextGroup, completedPasses);
}

function nextItemPosition<Target>(
  group: ScanGroup<Target>,
  item: Target,
  completedPasses: number,
): ScanPosition<Target> {
  // An item that is gone has index -1, so the scan continues at the first item.
  const nextItem = group.items[group.items.indexOf(item) + 1];
  if (nextItem === undefined) {
    return { level: "exit", container: group.container, completedPasses };
  }

  return itemPosition(group, nextItem, completedPasses);
}

function findGroupIndex<Target>(
  groups: readonly ScanGroup<Target>[],
  position: ScanPosition<Target> | null,
): number {
  return position
    ? groups.findIndex((group) => group.container === position.container)
    : -1;
}

function groupPosition<Target>(
  group: ScanGroup<Target>,
  completedPasses: number,
): ScanPosition<Target> {
  return { level: "groups", container: group.container, completedPasses };
}

function itemPosition<Target>(
  group: ScanGroup<Target>,
  item: Target,
  completedPasses: number,
): ScanPosition<Target> {
  return { level: "items", container: group.container, item, completedPasses };
}

/**
 * Two-level scanning. The scan moves through groups; selecting a group moves
 * through its items; selecting an item activates it. A group with one item
 * activates that item directly.
 *
 * Positions hold targets rather than indexes, so the groups may change between
 * steps: a position whose target is gone restarts the scan.
 */

export interface ScanGroup<Target> {
  container: Target;
  items: readonly [Target, ...Target[]];
}

export interface ScanPosition<Target> {
  group: Target;
  /** `null` while the scan is moving through groups. */
  item: Target | null;
  /** Passes over the current level that ended without a selection. */
  completedPasses: number;
}

export type ScanSelection<Target> =
  | { kind: "moved"; position: ScanPosition<Target> | null }
  | { kind: "activated"; target: Target };

// A second pass gives a missed item another chance before the scan returns
// to the groups, which is how a wrongly selected group is left.
const ITEM_PASSES = 2;

export function startScan<Target>(
  groups: readonly ScanGroup<Target>[],
): ScanPosition<Target> | null {
  const firstGroup = groups[0];

  return firstGroup ? groupPosition(firstGroup, 0) : null;
}

/**
 * Moves to the next group or item. Returns `null`, a paused scan, once the
 * groups have been passed `maxGroupPasses` times without a selection.
 */
export function advanceScan<Target>(
  groups: readonly ScanGroup<Target>[],
  position: ScanPosition<Target> | null,
  maxGroupPasses: number,
): ScanPosition<Target> | null {
  const groupIndex = findGroupIndex(groups, position);
  const group = groups[groupIndex];
  if (!position || !group) {
    return startScan(groups);
  }

  if (position.item === null) {
    return advanceGroup(groups, groupIndex, position, maxGroupPasses);
  }

  return advanceItem(group, position.item, position.completedPasses);
}

export function selectScan<Target>(
  groups: readonly ScanGroup<Target>[],
  position: ScanPosition<Target> | null,
): ScanSelection<Target> {
  const group = groups[findGroupIndex(groups, position)];
  if (!position || !group) {
    return { kind: "moved", position: startScan(groups) };
  }

  if (position.item === null && group.items.length === 1) {
    return { kind: "activated", target: group.items[0] };
  }

  if (position.item !== null && group.items.includes(position.item)) {
    return { kind: "activated", target: position.item };
  }

  return { kind: "moved", position: itemPosition(group, group.items[0], 0) };
}

function advanceGroup<Target>(
  groups: readonly ScanGroup<Target>[],
  groupIndex: number,
  position: ScanPosition<Target>,
  maxGroupPasses: number,
): ScanPosition<Target> | null {
  const nextIndex = (groupIndex + 1) % groups.length;
  const hasCompletedPass = nextIndex === 0;
  const completedPasses = position.completedPasses + (hasCompletedPass ? 1 : 0);

  const nextGroup = groups[nextIndex];
  if (!nextGroup || completedPasses >= maxGroupPasses) {
    return null;
  }

  return groupPosition(nextGroup, completedPasses);
}

function advanceItem<Target>(
  group: ScanGroup<Target>,
  item: Target,
  completedPasses: number,
): ScanPosition<Target> {
  // An item that is gone has index -1, so the scan continues at the first item.
  const nextItem = group.items[group.items.indexOf(item) + 1];
  if (nextItem !== undefined) {
    return itemPosition(group, nextItem, completedPasses);
  }

  if (completedPasses + 1 >= ITEM_PASSES) {
    return groupPosition(group, 0);
  }

  return itemPosition(group, group.items[0], completedPasses + 1);
}

function findGroupIndex<Target>(
  groups: readonly ScanGroup<Target>[],
  position: ScanPosition<Target> | null,
): number {
  return position
    ? groups.findIndex((group) => group.container === position.group)
    : -1;
}

function groupPosition<Target>(
  group: ScanGroup<Target>,
  completedPasses: number,
): ScanPosition<Target> {
  return { group: group.container, item: null, completedPasses };
}

function itemPosition<Target>(
  group: ScanGroup<Target>,
  item: Target,
  completedPasses: number,
): ScanPosition<Target> {
  return { group: group.container, item, completedPasses };
}

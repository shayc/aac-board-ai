import type { ScanGroup } from "./scan-sequence";

const GROUP_ATTRIBUTE = "data-scan-group";
const HIGHLIGHT_ATTRIBUTE = "data-scan-highlighted";
const ITEM_SELECTOR =
  ":is(button, [role='button']):not(:disabled, [aria-disabled='true'])";

/** Spread on an element to scan the enabled buttons inside it as one group. */
export const scanGroupProps = { [GROUP_ATTRIBUTE]: "" } as const;

// A highlighted item, or an item inside a highlighted group. Matching the
// group's items in CSS keeps the highlight on whichever buttons the group has
// now, as they are enabled, disabled, added, or replaced.
export const SCAN_HIGHLIGHTED_ITEM_SELECTOR = `${ITEM_SELECTOR}:is([${HIGHLIGHT_ATTRIBUTE}], [${HIGHLIGHT_ATTRIBUTE}] *)`;

export function listScanGroups(root: HTMLElement): ScanGroup<HTMLElement>[] {
  const groups: ScanGroup<HTMLElement>[] = [];

  for (const container of root.querySelectorAll<HTMLElement>(
    `[${GROUP_ATTRIBUTE}]`,
  )) {
    const [firstItem, ...otherItems] = listScanItems(container);
    if (firstItem) {
      groups.push({ container, items: [firstItem, ...otherItems] });
    }
  }

  return groups;
}

function listScanItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(ITEM_SELECTOR),
  ).filter((item) => item.checkVisibility({ visibilityProperty: true }));
}

// Dialogs, drawers, and menus hide everything behind them from assistive
// technology, which is how the scope learns that it is covered.
export function isScanningScopeCovered(scope: HTMLElement): boolean {
  return scope.closest("[aria-hidden='true'], [inert]") !== null;
}

/** Highlights an item, or every item of a group when given its container. */
export function highlightScanTarget(target: HTMLElement): () => void {
  target.setAttribute(HIGHLIGHT_ATTRIBUTE, "");

  const firstItem = target.querySelector(ITEM_SELECTOR) ?? target;
  firstItem.scrollIntoView({ block: "nearest", inline: "nearest" });

  return () => target.removeAttribute(HIGHLIGHT_ATTRIBUTE);
}

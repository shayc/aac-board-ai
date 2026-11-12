import type { ScanGroup } from "./scan-sequence";

const GROUP_ATTRIBUTE = "data-scan-group";
const HIGHLIGHT_ATTRIBUTE = "data-scan-highlighted";
const ITEM_SELECTOR =
  ":is(button, [role='button']):not(:disabled, [aria-disabled='true'])";

/** Spread on an element to scan the enabled buttons inside it as one group. */
export const scanGroupProps = { [GROUP_ATTRIBUTE]: "" } as const;

// CSS keeps group highlighting current as buttons are enabled or replaced.
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

export function isScanningScopeCovered(scope: HTMLElement): boolean {
  return scope.closest("[aria-hidden='true'], [inert]") !== null;
}

export function highlightScanTarget(target: HTMLElement): () => void {
  target.setAttribute(HIGHLIGHT_ATTRIBUTE, "");

  const firstItem = target.querySelector(ITEM_SELECTOR) ?? target;
  firstItem.scrollIntoView({ block: "nearest", inline: "nearest" });

  return () => target.removeAttribute(HIGHLIGHT_ATTRIBUTE);
}

import type { ScanGroup } from "./scan-sequence";

const GROUP_ATTRIBUTE = "data-scan-group";
const HIGHLIGHT_ATTRIBUTE = "data-scan-highlighted";
const ITEM_SELECTOR =
  ":is(button, [role='button']):not(:disabled, [aria-disabled='true'])";

/** Spread on an element to scan the enabled buttons inside it as one group. */
export const scanGroupProps = { [GROUP_ATTRIBUTE]: "" } as const;

export const SCAN_HIGHLIGHT_SELECTOR = `[${HIGHLIGHT_ATTRIBUTE}]`;

/** Lists the scan groups under `root` in document order, skipping empty ones. */
export function readScanGroups(root: HTMLElement): ScanGroup<HTMLElement>[] {
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

export function listScanItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
}

/** Highlights the targets and returns a function that removes the highlight. */
export function highlightScanTargets(
  targets: readonly HTMLElement[],
): () => void {
  for (const target of targets) {
    target.setAttribute(HIGHLIGHT_ATTRIBUTE, "");
  }

  targets[0]?.scrollIntoView({ block: "nearest", inline: "nearest" });

  return () => {
    for (const target of targets) {
      target.removeAttribute(HIGHLIGHT_ATTRIBUTE);
    }
  };
}
